declare module "*.aac" {
  const asset: string;
  export default asset;
}
declare module "*.css" {
  const asset: string;
  export default asset;
}
declare module "*.eot" {
  const asset: string;
  export default asset;
}
declare module "*.flac" {
  const asset: string;
  export default asset;
}
declare module "*.gif" {
  const asset: string;
  export default asset;
}
declare module "*.jpeg" {
  const asset: string;
  export default asset;
}
declare module "*.jpg" {
  const asset: string;
  export default asset;
}
declare module "*.json" {
  const asset: string;
  export default asset;
}
declare module "*.md" {
  import type { ComponentType as MdComponentType } from "react";

  const Component: MdComponentType;
  export const attributes: any;
  export const filename: string;
  export default Component;
}
declare module "*.mdx" {
  import type { ComponentType as MdxComponentType } from "react";

  const Component: MdxComponentType;
  export const attributes: any;
  export const filename: string;
  export default Component;
}
declare module "*.mp3" {
  const asset: string;
  export default asset;
}
declare module "*.mp4" {
  const asset: string;
  export default asset;
}
declare module "*.ogg" {
  const asset: string;
  export default asset;
}
declare module "*.otf" {
  const asset: string;
  export default asset;
}
declare module "*.png" {
  const asset: string;
  export default asset;
}
declare module "*.svg" {
  const asset: string;
  export default asset;
}
declare module "*.ttf" {
  const asset: string;
  export default asset;
}
declare module "*.wav" {
  const asset: string;
  export default asset;
}
declare module "*.webm" {
  const asset: string;
  export default asset;
}
declare module "*.webp" {
  const asset: string;
  export default asset;
}
declare module "*.woff" {
  const asset: string;
  export default asset;
}
declare module "*.woff2" {
  const asset: string;
  export default asset;
}

// 🔪🔪🔪🔪 On the esbuild CHOPPING BLOCK! 🔪🔪🔪🔪

declare module "css:*" {
  const asset: string;
  export default asset;
}

declare module "img:*" {
  const asset: ImageAsset;
  export default asset;
}

declare module "url:*" {
  const asset: string;
  export default asset;
}

/**
 * Image urls and metadata for images imported into applications.
 */
interface ImageAsset {
  /**
   * The url of the image. When using srcset, it's the last size defined.
   */
  src: string;

  /**
   * The width of the image. When using srcset, it's the last size defined.
   */
  width: number;

  /**
   * The height of the image. When using srcset, it's the last size defined.
   */
  height: number;

  /**
   * The string to be passed do `<img srcSet />` for responsive images. Sizes
   * defined by the asset import `srcset=...sizes` query string param, like
   * `./file.jpg?srcset=720,1080`.
   */
  srcset: string;

  /**
   * Base64 string that can be inlined for immediate render and scaled up. Typically set as the background
   * of an image:
   *
   * ```jsx
   * <img
   *   src={img.src}
   *   style={{
   *     backgroundImage: `url(${img.placeholder})`,
   *     backgroundSize: "cover"
   *   }}
   * />
   * ```
   */
  placeholder: string;

  /**
   * The image format.
   */
  format: "jpeg" | "png" | "webp" | "avif";
}
