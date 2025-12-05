"use client";

import Map, { Marker, NavigationControl, Source, Layer, type ViewState, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  center?: { lat: number; lng: number };
  markers?: Array<{ id: string; lat: number; lng: number; color?: string }>;
  route?: Array<{ lat: number; lng: number }>;
  polygons?: Array<Array<{ lat: number; lng: number }>>; // Each polygon is an array of points
  polygonFillColor?: string;
  polygonOutlineColor?: string;
  enableDraw?: boolean;
  onDrawChange?: (featureCollection: unknown) => void;
  onMove?: (state: ViewState) => void;
  onClick?: (lng: number, lat: number) => void;
};

export function MapContainer({ center, markers = [], route, polygons, polygonFillColor = "rgba(99, 102, 241, 0.2)", polygonOutlineColor = "#4f46e5", enableDraw = false, onDrawChange, onMove, onClick }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [initialViewState, setInitialViewState] = useState<ViewState>({
    longitude: center?.lng ?? 51.3890,
    latitude: center?.lat ?? 35.6892,
    zoom: 12,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  useEffect(() => {
    if (center) {
      setInitialViewState((prev) => ({
        ...prev,
        longitude: center.lng,
        latitude: center.lat,
      }));
    }
  }, [center]);

  const routeGeoJson = useMemo(() => {
    if (!route || route.length < 2) return null;
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: route.map((p) => [p.lng, p.lat]),
      },
      properties: {},
    };
  }, [route]);

  const polygonsGeoJson = useMemo(() => {
    if (!polygons || polygons.length === 0) return null;
    // Build a FeatureCollection of Polygons
    const features = polygons
      .filter((poly) => poly.length >= 3)
      .map((poly) => {
        const coords = poly.map((p) => [p.lng, p.lat]);
        // Ensure closed ring
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
          coords.push([first[0] ?? 0, first[1] ?? 0]);
        }
        return {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
          properties: {},
        };
      });
    return {
      type: "FeatureCollection",
      features,
    } as unknown;
  }, [polygons]);

  return (
    <div className="absolute inset-0">
      {token ? (
        <Map
          ref={mapRef}
          mapboxAccessToken={token}
          initialViewState={initialViewState}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onMove={(e) => onMove?.(e.viewState)}
          onClick={(e) => onClick?.(e.lngLat.lng, e.lngLat.lat)}
          onLoad={() => {
            if (!enableDraw || drawRef.current) return;
            const map = mapRef.current?.getMap();
            if (!map) return;
            const draw = new MapboxDraw({
              displayControlsDefault: false,
              controls: { polygon: true, trash: true },
            });
            map.addControl(draw, "top-left");
            const handler = () => onDrawChange?.(draw.getAll());
            map.on("draw.create", handler);
            map.on("draw.update", handler);
            map.on("draw.delete", handler);
            drawRef.current = draw;
          }}
        >
          <NavigationControl position="top-left" />
          {markers.map((m) => (
            <Marker
              key={m.id}
              longitude={m.lng}
              latitude={m.lat}
              color={m.color ?? "red"}
              anchor="bottom"
            />
          ))}
          {routeGeoJson && (
            <Source id="route" type="geojson" data={routeGeoJson as GeoJSON.Feature<GeoJSON.Geometry>}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  "line-color": "#3b82f6",
                  "line-width": 4,
                }}
              />
            </Source>
          )}
          {polygonsGeoJson && (
            <Source id="polygons" type="geojson" data={polygonsGeoJson as GeoJSON.FeatureCollection<GeoJSON.Geometry>}>
              <Layer
                id="polygon-fill"
                type="fill"
                paint={{
                  "fill-color": polygonFillColor,
                  "fill-opacity": 0.4,
                }}
              />
              <Layer
                id="polygon-outline"
                type="line"
                paint={{
                  "line-color": polygonOutlineColor,
                  "line-width": 2,
                }}
              />
            </Source>
          )}
        </Map>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment to view the map.
          </p>
        </div>
      )}
    </div>
  );
}