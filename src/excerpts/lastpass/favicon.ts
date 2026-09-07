// https://github.com/alex-popov-tech/extensions/blob/f12cce693f41e6669f5d6e27a908f3b26ea30bf7/extensions/lastpass/src/utils.ts#L4-L15
export const isValidUrl = (urlLike: string | undefined) => urlLike && urlLike !== "http://sn";
export const getDomainFavicon = (url: string | undefined): Image.ImageLike => {
  if (!url) {
    return Icon.Key;
  }
  try {
    new URL(url || "");
    return getFavicon(url);
  } catch {
    return Icon.Key;
  }
};
