// IMPORTS
import {
  getStandardGuideImagePath,
  openGuideImageModal
} from "./imageModal.js";

// STATE
const MOBILE_MEDIA = "(max-width: 639px)";
const LAPTOP_MEDIA = "(min-width: 640px) and (max-width: 1199px)";
const DESKTOP_MEDIA = "(min-width: 1200px)";

// BUILD
/** Builds one responsive source element */
function buildSource(device, filename, media) {
  const source = document.createElement("source");
  source.media = media;
  source.srcset = getStandardGuideImagePath(device, filename);
  return source;
}


/** Builds the accessible image modal trigger */
function buildImageButton(filename, altText, caption, picture) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "guide-image__button";
  button.setAttribute("aria-label", "Open larger image: " + (altText || "Guide image"));
  button.appendChild(picture);
  button.addEventListener("click", function () {
    openGuideImageModal(filename, altText, caption);
  });
  return button;
}


/** Builds an optional responsive guide image figure */
export function buildGuideImage(filename, altText, caption) {
  const imageName = String(filename || "").trim();
  if (!imageName) return null;

  const figure = document.createElement("figure");
  figure.className = "guide-image";

  const picture = document.createElement("picture");
  picture.className = "guide-image__picture";
  picture.appendChild(buildSource("mobile", imageName, MOBILE_MEDIA));
  picture.appendChild(buildSource("laptop", imageName, LAPTOP_MEDIA));
  picture.appendChild(buildSource("desktop", imageName, DESKTOP_MEDIA));

  const image = document.createElement("img");
  image.className = "guide-image__img";
  image.src = getStandardGuideImagePath("mobile", imageName);
  image.alt = String(altText || "");
  image.loading = "lazy";
  image.decoding = "async";
  picture.appendChild(image);

  const captionText = String(caption || "").trim();
  figure.appendChild(buildImageButton(imageName, altText, caption, picture));

  if (captionText) {
    const figcaption = document.createElement("figcaption");
    figcaption.className = "guide-image__caption";
    figcaption.textContent = captionText;
    figure.appendChild(figcaption);
  }

  return figure;
}
