// STATE
const IMAGE_ROOT = "../images";
const IMAGE_SET = "main";
const IMAGE_OUTPUT = "optimized";
const STANDARD_VERSION = "standard";
const ZOOM_VERSION = "zoom";
const MOBILE_MEDIA = "(max-width: 639px)";
const LAPTOP_MEDIA = "(min-width: 640px) and (max-width: 1199px)";

// BUILD
/** Returns a generated guide image path */
export function getGuideImagePath(device, version, filename) {
  return IMAGE_ROOT + "/" + IMAGE_SET + "/" + IMAGE_OUTPUT + "/" + device + "/" + version + "/" + filename;
}


/** Returns a standard guide image path */
export function getStandardGuideImagePath(device, filename) {
  return getGuideImagePath(device, STANDARD_VERSION, filename);
}


/** Returns a zoom guide image path */
function getZoomGuideImagePath(device, filename) {
  return getGuideImagePath(device, ZOOM_VERSION, filename);
}


/** Builds one modal source element */
function buildSource(device, filename, media) {
  const source = document.createElement("source");
  source.media = media;
  source.srcset = getZoomGuideImagePath(device, filename);
  return source;
}


/** Builds the modal zoom picture */
function buildZoomPicture(filename, altText) {
  const picture = document.createElement("picture");
  picture.className = "guide-image-modal__picture";
  picture.appendChild(buildSource("mobile", filename, MOBILE_MEDIA));
  picture.appendChild(buildSource("laptop", filename, LAPTOP_MEDIA));

  const image = document.createElement("img");
  image.className = "guide-image-modal__img";
  image.src = getZoomGuideImagePath("desktop", filename);
  image.alt = String(altText || "");
  image.decoding = "async";
  picture.appendChild(image);
  return picture;
}


/** Locks page scrolling and returns a restore callback */
function lockPageScroll() {
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return function restorePageScroll() {
    document.body.style.overflow = previousOverflow;
  };
}


/** Opens a modal containing the zoom version of a guide image */
export function openGuideImageModal(filename, altText, caption) {
  const imageName = String(filename || "").trim();
  if (!imageName) return null;

  const previousFocus = document.activeElement;
  const restoreScroll = lockPageScroll();
  const overlay = document.createElement("div");
  overlay.className = "guide-image-modal";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Larger guide image");

  const dialog = document.createElement("div");
  dialog.className = "guide-image-modal__dialog";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "guide-image-modal__close";
  closeButton.setAttribute("aria-label", "Close larger image");
  closeButton.textContent = "Close";

  const figure = document.createElement("figure");
  figure.className = "guide-image-modal__figure";
  figure.appendChild(buildZoomPicture(imageName, altText));

  const captionText = String(caption || "").trim();
  if (captionText) {
    const figcaption = document.createElement("figcaption");
    figcaption.className = "guide-image-modal__caption";
    figcaption.textContent = captionText;
    figure.appendChild(figcaption);
  }

  function closeModal() {
    document.removeEventListener("keydown", handleKeydown);
    closeButton.removeEventListener("click", closeModal);
    overlay.removeEventListener("click", handleOverlayClick);
    overlay.remove();
    restoreScroll();
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  }

  function handleOverlayClick(event) {
    if (event.target === overlay) closeModal();
  }

  function handleKeydown(event) {
    if (event.key === "Escape") closeModal();
  }

  closeButton.addEventListener("click", closeModal);
  overlay.addEventListener("click", handleOverlayClick);
  document.addEventListener("keydown", handleKeydown);

  dialog.appendChild(closeButton);
  dialog.appendChild(figure);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  closeButton.focus();
  return overlay;
}
