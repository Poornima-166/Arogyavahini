import L from 'leaflet';

/**
 * Defensive patch for Leaflet to prevent:
 * "Uncaught TypeError: Cannot read properties of undefined (reading '_leaflet_pos')"
 * 
 * This error occurs in modern single-page apps (especially React 18/19 StrictMode, 
 * tab switching, modal unmounts, and animated pan/zoom) when an animation step,
 * pane position query, or layer removal attempts to read or write `_leaflet_pos` 
 * on an element that is undefined or has been detached/removed from the DOM.
 */
if (typeof window !== 'undefined' && L) {
  if (L.DomUtil) {
    const origGetPosition = L.DomUtil.getPosition;
    L.DomUtil.getPosition = function (el: any): L.Point {
      if (!el) {
        return new L.Point(0, 0);
      }
      try {
        if (typeof origGetPosition === 'function') {
          return origGetPosition(el);
        }
        return el._leaflet_pos || new L.Point(0, 0);
      } catch {
        return new L.Point(0, 0);
      }
    };

    const origSetPosition = L.DomUtil.setPosition;
    L.DomUtil.setPosition = function (el: any, point: any): void {
      if (!el) return;
      try {
        if (typeof origSetPosition === 'function') {
          origSetPosition(el, point);
        } else {
          el._leaflet_pos = point;
        }
      } catch {
        // Element was detached mid-frame; safely ignore
      }
    };
  }

  // Defensive patch for PosAnimation
  if ((L as any).PosAnimation && (L as any).PosAnimation.prototype) {
    const animProto = (L as any).PosAnimation.prototype;
    const origStep = animProto._step;
    if (origStep) {
      animProto._step = function (fast?: boolean) {
        if (!this._el) {
          this._inProgress = false;
          return;
        }
        try {
          origStep.call(this, fast);
        } catch (err: any) {
          if (err?.message?.includes('_leaflet_pos') || !this._el) {
            this._inProgress = false;
            return;
          }
          throw err;
        }
      };
    }
  }

  // Defensive patch for Map._getMapPanePos
  if ((L as any).Map && (L as any).Map.prototype) {
    const mapProto = (L as any).Map.prototype;
    const origGetMapPanePos = mapProto._getMapPanePos;
    if (origGetMapPanePos) {
      mapProto._getMapPanePos = function (): L.Point {
        if (!this._mapPane) {
          return new L.Point(0, 0);
        }
        try {
          return origGetMapPanePos.call(this);
        } catch {
          return new L.Point(0, 0);
        }
      };
    }
  }
}

export default L;
