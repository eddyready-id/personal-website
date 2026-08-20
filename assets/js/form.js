/* ==========================================================================
   FORM.JS — logic for the /kata-kata submission form
   ==========================================================================
   Responsibilities:
     • live character counter + gentle inline validation
     • pick a photo → downscale it → show an instant preview
     • on submit: upload the photo (with REAL progress), insert the row,
       then crossfade to a thank-you state
     • idle → sending → success state machine on the submit button

   The photo upload is done with a hand-written XMLHttpRequest (not the
   Supabase library) for ONE reason: XHR exposes true byte-by-byte upload
   progress, so we can show a real progress ring instead of a fake spinner.
   The database insert still goes through the Supabase library.
   ========================================================================== */

import { supabase } from "./supabase-client.js";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  PHOTO_BUCKET,
  MESSAGES_TABLE,
  isConfigured,
} from "./supabase-config.js";
import { setupThemeToggle } from "./theme.js";

/* ---- tunables ---------------------------------------------------------- */
const MAX_MESSAGE = 500; // characters
const MAX_UPLOAD_MB = 15; // reject absurdly large originals before we even resize
const RESIZE_MAX_EDGE = 1600; // downscale so the longest side is at most this many px
const RESIZE_QUALITY = 0.85; // JPEG quality after resize
const UPLOAD_TIMEOUT_MS = 60000; // give up on a stalled upload after 60s

/* ---- elements ---------------------------------------------------------- */
const stage = document.getElementById("stage");
const form = document.getElementById("message-form");
const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");
const messageCount = document.getElementById("message-count");
const photoInput = document.getElementById("photo");
const dropzone = document.getElementById("dropzone");
const preview = document.getElementById("photo-preview");
const previewImg = document.getElementById("photo-preview-img");
const photoName = document.getElementById("photo-name");
const photoRemove = document.getElementById("photo-remove");
const uploadVeil = document.getElementById("upload-veil");
const uploadFill = document.getElementById("upload-fill");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-btn-label");
const formError = document.getElementById("form-error");
const writeAgain = document.getElementById("write-again");

setupThemeToggle(document.getElementById("theme-toggle"));

/* Holds the processed (downscaled) photo ready to upload, plus a preview
   URL we must revoke later to avoid leaking memory. null when no photo. */
let photo = null; // { blob, name, previewUrl }

/* True while a submission is in flight. Disabling the button covers the
   ordinary double-tap, but it does NOT stop the form being submitted a
   second time (e.g. pressing Enter in a field, or any programmatic submit)
   — and a second run would create a duplicate message on the wall. This
   flag is the actual guard. */
let isSubmitting = false;

/* ======================================================================
   CHARACTER COUNTER
   ====================================================================== */
messageInput.addEventListener("input", function () {
  const len = messageInput.value.length;
  messageCount.textContent = len + " / " + MAX_MESSAGE;
  messageCount.classList.toggle("is-near", len >= MAX_MESSAGE * 0.85 && len < MAX_MESSAGE);
  messageCount.classList.toggle("is-over", len >= MAX_MESSAGE);
  clearFieldError("message");
});
nameInput.addEventListener("input", function () { clearFieldError("name"); });

/* Validate on blur (helpful, not punitive — we don't nag on every keystroke). */
nameInput.addEventListener("blur", function () { validateName(); });
messageInput.addEventListener("blur", function () { validateMessage(); });

/* ======================================================================
   PHOTO: pick → validate → downscale → preview
   ====================================================================== */
photoInput.addEventListener("change", function () {
  const file = photoInput.files && photoInput.files[0];
  if (file) handleChosenPhoto(file);
});

/* Desktop drag-and-drop onto the dropzone. */
["dragenter", "dragover"].forEach(function (evt) {
  dropzone.addEventListener(evt, function (e) {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  });
});
["dragleave", "drop"].forEach(function (evt) {
  dropzone.addEventListener(evt, function (e) {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
  });
});
dropzone.addEventListener("drop", function (e) {
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleChosenPhoto(file);
});

photoRemove.addEventListener("click", clearPhoto);

async function handleChosenPhoto(file) {
  clearFieldError("photo");

  // Basic guards with friendly, specific messages.
  if (!file.type.startsWith("image/")) {
    showFieldError("photo", "File itu bukan gambar. Pilih foto JPG atau PNG.");
    return;
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    showFieldError("photo", "Foto terlalu besar (maks " + MAX_UPLOAD_MB + "MB).");
    return;
  }

  // Downscale so uploads are fast on event wifi/cellular and the wall stays
  // light. If the browser can't do it, we fall back to the original file.
  let blob;
  try {
    blob = await resizeImage(file, RESIZE_MAX_EDGE, RESIZE_QUALITY);
  } catch (e) {
    blob = file;
  }

  // Clean up any previous preview URL before making a new one.
  if (photo && photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);

  const previewUrl = URL.createObjectURL(blob);
  photo = { blob: blob, name: file.name, previewUrl: previewUrl };

  previewImg.src = previewUrl;
  photoName.textContent = file.name;
  dropzone.hidden = true;
  preview.hidden = false;
}

function clearPhoto() {
  if (photo && photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
  photo = null;
  photoInput.value = "";
  previewImg.removeAttribute("src");
  preview.hidden = true;
  dropzone.hidden = false;
  clearFieldError("photo");
}

/* Draw the image onto a canvas at a capped size and re-export as JPEG.
   `imageOrientation: "from-image"` respects the EXIF rotation phones embed,
   so portrait photos don't come out sideways. */
async function resizeImage(file, maxEdge, quality) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  let w = bitmap.width;
  let h = bitmap.height;

  const longest = Math.max(w, h);
  if (longest > maxEdge) {
    const scale = maxEdge / longest;
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  if (bitmap.close) bitmap.close();

  return await new Promise(function (resolve) {
    canvas.toBlob(function (out) { resolve(out || file); }, "image/jpeg", quality);
  });
}

/* ======================================================================
   VALIDATION
   ====================================================================== */
function validateName() {
  const v = nameInput.value.trim();
  if (v.length === 0) {
    showFieldError("name", "Isi nama kamu dulu ya.");
    return false;
  }
  clearFieldError("name");
  return true;
}
function validateMessage() {
  const v = messageInput.value.trim();
  if (v.length === 0) {
    showFieldError("message", "Tulis ucapanmu dulu.");
    return false;
  }
  if (v.length > MAX_MESSAGE) {
    showFieldError("message", "Ucapan maksimal " + MAX_MESSAGE + " karakter.");
    return false;
  }
  clearFieldError("message");
  return true;
}

function showFieldError(fieldName, text) {
  const field = document.querySelector('.field[data-field="' + fieldName + '"]');
  const errorEl = document.getElementById(fieldName + "-error");
  if (field) field.classList.add("is-invalid");
  if (errorEl) {
    errorEl.textContent = text;
    errorEl.hidden = false;
  }
}
function clearFieldError(fieldName) {
  const field = document.querySelector('.field[data-field="' + fieldName + '"]');
  const errorEl = document.getElementById(fieldName + "-error");
  if (field) field.classList.remove("is-invalid");
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }
}

/* ======================================================================
   SUBMIT — the idle → sending → success state machine
   ====================================================================== */
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (isSubmitting) return; // already sending — ignore the repeat
  formError.hidden = true;

  // Validate everything; focus the first problem.
  const nameOk = validateName();
  const messageOk = validateMessage();
  if (!nameOk) { nameInput.focus(); return; }
  if (!messageOk) { messageInput.focus(); return; }

  // If the keys haven't been filled into supabase-config.js yet, say so
  // clearly instead of failing with a cryptic network error.
  if (!isConfigured()) {
    showFormError(
      "Form belum terhubung ke database. Isi kunci Supabase di " +
        "assets/js/supabase-config.js (lihat SUPABASE-SETUP.md)."
    );
    return;
  }

  setSending(true);

  try {
    let photoUrl = null;

    if (photo) {
      showUploadVeil(true);
      const path = safeFileName();
      photoUrl = await uploadPhotoWithProgress(photo.blob, path, function (fraction) {
        setUploadProgress(fraction);
      });
    }

    const { error } = await supabase.from(MESSAGES_TABLE).insert({
      name: nameInput.value.trim(),
      message: messageInput.value.trim(),
      photo_url: photoUrl,
    });

    if (error) throw error;

    showSuccess();
  } catch (err) {
    console.error("Submit failed:", err);
    setSending(false);
    showUploadVeil(false);
    // Tell the guest what happened AND that nothing they typed was lost —
    // the form is deliberately left filled in so "Kirim ucapan" just works
    // on a second try.
    const code = err && err.message ? err.message : "";
    let msg;
    if (code === "TIMEOUT") {
      msg = "Koneksi terlalu lambat, foto gagal terkirim. Ucapanmu masih tersimpan di sini — coba tekan Kirim lagi ya.";
    } else if (code === "NETWORK") {
      msg = "Koneksi terputus saat mengirim. Ucapanmu masih tersimpan di sini — coba tekan Kirim lagi ya.";
    } else {
      msg = "Maaf, ucapanmu gagal terkirim. Ucapanmu masih tersimpan di sini — coba tekan Kirim lagi ya.";
    }
    showFormError(msg);
  }
});

function setSending(sending) {
  isSubmitting = sending;
  submitBtn.disabled = sending;
  submitBtn.classList.toggle("is-sending", sending);
  submitLabel.textContent = sending ? "Mengirim…" : "Kirim ucapan";
}

function showUploadVeil(show) {
  uploadVeil.hidden = !show;
  if (show) setUploadProgress(0);
}
function setUploadProgress(fraction) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  uploadFill.style.width = pct + "%"; // the slim bottom bar fills with real progress
}

function showSuccess() {
  // Move the page from the form to the thank-you panel (CSS crossfades them).
  stage.setAttribute("data-state", "thanks");
  // Send keyboard focus to the thank-you heading for screen-reader users.
  const heading = document.getElementById("thanks-heading");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }
}

function showFormError(text) {
  formError.textContent = text;
  formError.hidden = false;
}

/* "Tulis ucapan lain" — reset back to a clean form. */
writeAgain.addEventListener("click", function () {
  form.reset();
  clearPhoto();
  clearFieldError("name");
  clearFieldError("message");
  clearFieldError("photo");
  messageCount.textContent = "0 / " + MAX_MESSAGE;
  messageCount.classList.remove("is-near", "is-over");
  setSending(false);
  showUploadVeil(false);
  stage.setAttribute("data-state", "form");
  nameInput.focus();
});

/* ======================================================================
   THE REAL-PROGRESS UPLOADER (XMLHttpRequest)
   ====================================================================== */
function uploadPhotoWithProgress(blob, path, onProgress) {
  return new Promise(function (resolve, reject) {
    // The bucket name can contain spaces/capitals ("Birthday Eddy Sadeli"),
    // so URL-encode it for the request path (spaces become %20).
    const bucket = encodeURIComponent(PHOTO_BUCKET);
    const endpoint =
      SUPABASE_URL + "/storage/v1/object/" + bucket + "/" + path;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Authorization", "Bearer " + SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", blob.type || "image/jpeg");
    xhr.setRequestHeader("cache-control", "3600");

    // THIS is the whole reason we use XHR: real upload progress events.
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(1);
        // Public URL for a file in a public bucket (bucket name encoded):
        resolve(
          SUPABASE_URL + "/storage/v1/object/public/" + bucket + "/" + path
        );
      } else {
        reject(new Error("Upload gagal (" + xhr.status + "): " + xhr.responseText));
      }
    };
    xhr.onerror = function () { reject(new Error("NETWORK")); };

    // Without a timeout a stalled connection (patchy venue wifi) leaves the
    // request open forever — the button would sit on "Mengirim…" with no
    // error and no way to retry. This gives up after UPLOAD_TIMEOUT_MS and
    // rejects, which lands in the submit handler's catch block: that
    // re-enables the button and keeps everything the guest typed.
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.ontimeout = function () { reject(new Error("TIMEOUT")); };

    xhr.send(blob);
  });
}

/* A collision-resistant filename. crypto.randomUUID is in all modern
   browsers; the fallback covers very old ones. */
function safeFileName() {
  const id =
    window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  return id + ".jpg";
}

/* ======================================================================
   DEV-ONLY preview hook (localhost / 127.0.0.1 ONLY — never on the live
   site). Lets you preview the sending → success states without a real
   Supabase project while you're building. In the browser console:
       __erForm.sending()      // show the "Mengirim…" state
       __erForm.progress(0.6)  // move the upload ring to 60%
       __erForm.success()      // crossfade to the thank-you panel
   ====================================================================== */
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  window.__erForm = {
    sending: function () { setSending(true); },
    idle: function () { setSending(false); },
    veil: function (show) { showUploadVeil(show !== false); },
    progress: function (f) { showUploadVeil(true); setUploadProgress(f); },
    success: showSuccess,
    reset: function () { writeAgain.click(); },
  };
}
