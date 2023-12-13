function scrollToElement(
  scrollToElementId: string,
  anchorElementId: string,
  scrollFrameId: string
) {
  const scrollToElement = document.getElementById(scrollToElementId);
  const topScrollElement = document.getElementById(anchorElementId);
  const parentScrollElement = document.getElementById(scrollFrameId);
  if (scrollToElement && topScrollElement && parentScrollElement) {
    const topScrollAnchor = topScrollElement.getBoundingClientRect().top;
    parentScrollElement.scroll({
      top: scrollToElement.getBoundingClientRect().top - topScrollAnchor,
      left: 0,
      behavior: 'smooth',
    });
  }
}

export default scrollToElement;
