// Fix jsdom MouseEvent.offsetX/MouseEvent.offsetY, until https://github.com/jsdom/jsdom/pull/3484 is merged
if (!MouseEvent.prototype.hasOwnProperty("offsetX")) {
  function setOffsetXY(event: any) {
    event.offsetX = 0;
    event.offsetY = 0;
  }
  window.addEventListener("click", setOffsetXY, { capture: true });
  window.addEventListener("dblclick", setOffsetXY, { capture: true });
  window.addEventListener("mousedown", setOffsetXY, { capture: true });
  window.addEventListener("mouseenter", setOffsetXY, { capture: true });
  window.addEventListener("mouseleave", setOffsetXY, { capture: true });
  window.addEventListener("mousemove", setOffsetXY, { capture: true });
  window.addEventListener("mouseout", setOffsetXY, { capture: true });
  window.addEventListener("mouseover", setOffsetXY, { capture: true });
  window.addEventListener("mouseup", setOffsetXY, { capture: true });
}
