import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Briefcase, Plus, Search, Loader2, Check, ArrowLeft, ChevronDown, X, MapPin, AlertCircle, Target, RefreshCw, Minus, ChevronUp, Building2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// The functional (…F) variants clean themselves up correctly; the class
// versions leak an instance under StrictMode's double-mount, which left a
// stale radius circle behind at the previous centre.
import { GoogleMap, useJsApiLoader, InfoWindowF, CircleF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import type { Meishi } from '../../types/app';
import { useToast } from '../Toast';
import { buildGeocodeQuery, geocodeSequentially } from '../../services/geocodeService';
import { useSwipeBack } from '../../hooks/useSwipeBack';

export const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const TOKYO_METROPOLITAN_GOVERNMENT = { lat: 35.6894, lng: 139.6917 };

/** A meishi that has real coordinates and can therefore be drawn. */
type MappableMeishi = Meishi & { lat: number; lng: number };

/** Several colleagues share one address, so pins are grouped per company. */
interface CompanyGroup {
  key: string;
  company: string;
  lat: number;
  lng: number;
  members: MappableMeishi[];
}

interface MeishiMapViewProps {
  onBack: () => void;
  meishis: Meishi[];
  /** Persist a resolved address so it is only ever geocoded once. */
  onGeocoded?: (id: string, lat: number, lng: number) => void;
  /** Open the full card detail from a pin or the list sheet. */
  onSelectMeishi?: (meishi: Meishi) => void;
}

export const MeishiMapView: React.FC<MeishiMapViewProps> = ({
  onBack, meishis, onGeocoded, onSelectMeishi,
}) => {
  const toast = useToast();
  const [mapCenter, setMapCenter] = useState(TOKYO_METROPOLITAN_GOVERNMENT);
  const [zoom, setZoom] = useState(15);
  const [selectedGroup, setSelectedGroup] = useState<CompanyGroup | null>(null);
  const [radius, setRadius] = useState<number>(500);
  const [isRadiusDropdownOpen, setIsRadiusDropdownOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
  const [locationName, setLocationName] = useState("東京都庁");
  const [searchQuery, setSearchQuery] = useState("");
  const [addressResults, setAddressResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [meishiResults, setMeishiResults] = useState<Meishi[]>([]);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Group pins by company (default) or show one pin per person.
  const [groupByCompany, setGroupByCompany] = useState(true);
  // The list is a full page, not an overlay, so the map and list are two
  // modes of the same screen rather than one stacked on the other.
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Coordinates resolved during this session, before the parent persists them.
  const [resolvedCoords, setResolvedCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeFailures, setGeocodeFailures] = useState(0);
  // Cards we already attempted this session, so a retry press doesn't loop.
  const attemptedRef = useRef<Set<string>>(new Set());

  // @types/react isn't installed, so hooks infer as `any`. Take an
  // explicitly typed handle on the list to keep the logic below type-checked.
  const meishiList: Meishi[] = meishis;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationName("現在地");
      },
      (error) => {
        console.warn("Error getting current location, using default (Tokyo):", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  /**
   * Only cards with real coordinates go on the map. Previously missing
   * coordinates were faked with Math.random() around Tokyo, which put every
   * pin in the wrong place and moved them on each re-render.
   */
  const mappableMeishis = useMemo(() => {
    const list: MappableMeishi[] = [];
    meishiList.forEach((m) => {
      const coords = m.lat && m.lng ? { lat: m.lat, lng: m.lng } : resolvedCoords[m.id];
      if (coords) list.push({ ...m, lat: coords.lat, lng: coords.lng });
    });
    return list;
  }, [meishiList, resolvedCoords]);

  /** Cards with an address we haven't managed to place yet. */
  const pendingGeocode = useMemo(() => {
    return meishiList.filter(
      (m) =>
        !(m.lat && m.lng) &&
        !resolvedCoords[m.id] &&
        buildGeocodeQuery(m.address, m.detailedAddress).length > 0
    );
  }, [meishiList, resolvedCoords]);

  /** Cards that can never be mapped because the card carries no address. */
  const withoutAddress = useMemo(
    () =>
      meishiList.filter(
        (m) => !(m.lat && m.lng) && !resolvedCoords[m.id] && !buildGeocodeQuery(m.address, m.detailedAddress)
      ).length,
    [meishiList, resolvedCoords]
  );

  const runGeocoding = useCallback(async () => {
    const todo: Meishi[] = pendingGeocode.filter((m: Meishi) => !attemptedRef.current.has(m.id));
    if (todo.length === 0 || isGeocoding) return;

    setIsGeocoding(true);
    todo.forEach((m) => attemptedRef.current.add(m.id));

    const { failed } = await geocodeSequentially<Meishi>(
      todo,
      (m) => buildGeocodeQuery(m.address, m.detailedAddress),
      (m, coords) => {
        setResolvedCoords((prev) => ({ ...prev, [m.id]: coords }));
        onGeocoded?.(m.id, coords.lat, coords.lng);
      }
    );

    setGeocodeFailures(failed);
    setIsGeocoding(false);
  }, [pendingGeocode, isGeocoding, onGeocoded]);

  // Place any un-geocoded addresses as soon as the SDK is ready.
  useEffect(() => {
    if (isLoaded && !loadError) void runGeocoding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, loadError, meishis.length]);

  // Haversine distance in metres.
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  /** Cards inside the radius, nearest first, each with its distance. */
  const meishisInRadius = useMemo(() => {
    return mappableMeishis
      .map((m) => ({ ...m, distance: getDistance(mapCenter.lat, mapCenter.lng, m.lat, m.lng) }))
      .filter((m) => m.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }, [mappableMeishis, mapCenter, radius]);

  const formatDistance = (metres: number) =>
    metres >= 1000 ? `${(metres / 1000).toFixed(1)}km` : `${Math.round(metres)}m`;

  /**
   * Pins to draw. In company mode colleagues at one address collapse into a
   * single pin with a count, which stops markers stacking exactly on top of
   * each other and hiding one another.
   */
  const pins = useMemo<CompanyGroup[]>(() => {
    if (!groupByCompany) {
      return meishisInRadius.map((m) => ({
        key: m.id,
        company: m.name || m.company || '名称未設定',
        lat: m.lat,
        lng: m.lng,
        members: [m],
      }));
    }

    const groups = new Map<string, CompanyGroup>();
    meishisInRadius.forEach((m) => {
      const company = m.company || '会社名なし';
      const existing = groups.get(company);
      if (existing) {
        existing.members.push(m);
      } else {
        groups.set(company, { key: company, company, lat: m.lat, lng: m.lng, members: [m] });
      }
    });
    return [...groups.values()];
  }, [meishisInRadius, groupByCompany]);

  // Keep the open InfoWindow in sync when the underlying pins change.
  useEffect(() => {
    if (!selectedGroup) return;
    const stillVisible = pins.find((p) => p.key === selectedGroup.key);
    setSelectedGroup(stillVisible ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("お使いの端末は位置情報機能に対応していません。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationName("現在地");
        setZoom(15);
      },
      () => toast.error("現在地を取得できませんでした。\n位置情報へのアクセスが許可されているかご確認ください。"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /** Re-centre on wherever the map is now, and retry any unplaced addresses. */
  const handleSearchArea = async () => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      if (center) {
        setMapCenter({ lat: center.lat(), lng: center.lng() });
        setLocationName("この地図の範囲");
      }
    }
    attemptedRef.current.clear();
    await runGeocoding();
  };

  // Places autocomplete for the "change base location" sheet.
  useEffect(() => {
    if (!isLoaded || !searchQuery.trim()) {
      setAddressResults([]);
      setMeishiResults([]);
      setPlacesError(null);
      return;
    }

    const timer = setTimeout(() => {
      const lowerQuery = searchQuery.toLowerCase();
      setMeishiResults(
        mappableMeishis.filter(
          (m) =>
            m.company?.toLowerCase().includes(lowerQuery) ||
            m.name.toLowerCase().includes(lowerQuery) ||
            m.address?.toLowerCase().includes(lowerQuery)
        )
      );

      try {
        if (!window.google?.maps?.places) {
          setPlacesError("Places APIが読み込まれていません。");
          return;
        }
        new window.google.maps.places.AutocompleteService().getPlacePredictions(
          { input: searchQuery, componentRestrictions: { country: 'jp' } },
          (predictions, status) => {
            const S = window.google.maps.places.PlacesServiceStatus;
            if (status === S.OK && predictions) {
              setAddressResults(predictions);
              setPlacesError(null);
            } else if (status === S.ZERO_RESULTS) {
              setAddressResults([]);
              setPlacesError(null);
            } else {
              setAddressResults([]);
              setPlacesError(
                status === S.REQUEST_DENIED
                  ? "Google Cloud Consoleで「Places API」を有効にしてください。"
                  : `検索エラーが発生しました (${status})`
              );
            }
          }
        );
      } catch (err) {
        console.error("Error in Places Autocomplete:", err);
        setPlacesError("検索中にエラーが発生しました。");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isLoaded, mappableMeishis]);

  const handleSelectAddress = (placeId: string, mainText: string) => {
    new google.maps.Geocoder().geocode({ placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const location = results[0].geometry.location;
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setLocationName(mainText);
        setIsLocationSearchOpen(false);
        setSearchQuery("");
      } else if (
        status === google.maps.GeocoderStatus.REQUEST_DENIED ||
        status === google.maps.GeocoderStatus.UNKNOWN_ERROR
      ) {
        toast.error("Geocoding APIが有効になっていません。\nGoogle Cloud Consoleで有効にしてください。");
      } else {
        toast.error(`住所の詳細を取得できませんでした。(${status})`);
      }
    });
  };

  const focusOnMeishi = (meishi: MappableMeishi) => {
    setMapCenter({ lat: meishi.lat, lng: meishi.lng });
    setLocationName(meishi.company || meishi.name);
    setZoom(17);
    setIsLocationSearchOpen(false);
    setViewMode('map');
    setSearchQuery("");
  };

  const mapContainerStyle = { width: '100%', height: '100%', minHeight: '400px' };
  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: 'greedy',
    styles: [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
    ],
  };

  // Left-edge swipe goes back, same as the arrow.
  useSwipeBack(onBack);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-surface z-[60] flex flex-col max-w-md mx-auto shadow-2xl pt-safe"
    >
      {/* Header */}
      <div className="flex items-center p-4 bg-surface">
        <button aria-label="戻る" onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="ml-4 text-lg font-bold text-ink">名刺地図</h1>
      </div>

      {/* Filters Bar */}
      <div className="flex justify-between items-center gap-2 px-4 py-2 bg-canvas border-b border-line relative z-20">
        <button
          onClick={() => setIsLocationSearchOpen(true)}
          className="flex items-center gap-1 text-sm font-medium text-ink-muted min-w-0 flex-1"
        >
          <span className="truncate">{locationName}</span>
          <ChevronDown className="w-4 h-4 text-ink-faint shrink-0" />
        </button>
        <div className="relative shrink-0">
          <button
            onClick={() => setIsRadiusDropdownOpen(!isRadiusDropdownOpen)}
            className="flex items-center gap-1 text-sm font-medium text-ink-muted"
          >
            <span>半径 {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</span>
            <ChevronDown className="w-4 h-4 text-ink-faint" />
          </button>

          <AnimatePresence>
            {isRadiusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsRadiusDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-lg border border-line overflow-hidden z-50"
                >
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-surface border-t border-l border-line transform rotate-45" />
                  <div className="relative bg-surface z-10">
                    {[
                      { label: '500m', value: 500, zoom: 15 },
                      { label: '1km', value: 1000, zoom: 14 },
                      { label: '2km', value: 2000, zoom: 13 },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRadius(option.value);
                          setIsRadiusDropdownOpen(false);
                          setZoom(option.zoom);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left text-base hover:bg-canvas transition-colors ${
                          radius === option.value ? 'text-ink font-medium' : 'text-ink-muted'
                        } ${option.value !== 2000 ? 'border-b border-line' : ''}`}
                      >
                        <span>{option.label}</span>
                        {radius === option.value && <Check className="w-5 h-5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Switch back to the map from the list page */}
        {viewMode === 'list' && (
          <button
            onClick={() => setViewMode('map')}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-primary text-sm font-medium"
          >
            <ChevronDown className="w-4 h-4" />
            地図
          </button>
        )}
      </div>

      {/* List page: full screen, not an overlay on the map */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto bg-surface min-h-0">
          {meishisInRadius.length === 0 ? (
            <div className="h-full flex items-center justify-center px-8">
              <p className="text-ink-faint text-[15px]">検索結果がありません。</p>
            </div>
          ) : (
            meishisInRadius.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMeishi?.(m)}
                className="w-full flex items-start gap-4 px-5 py-5 text-left hover:bg-canvas transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[17px] font-bold text-ink truncate">{m.name}</h3>
                    <span className="text-[13px] font-medium text-accent shrink-0">
                      {formatDistance(m.distance)}
                    </span>
                  </div>
                  <p className="text-[14px] text-ink-muted mt-1 truncate">
                    {[m.position, m.department].filter(Boolean).join(' / ')}
                  </p>
                  <p className="text-[14px] text-ink-muted truncate">{m.company}</p>
                </div>
                {m.imageUrl && (
                  <div className="w-[104px] h-[64px] rounded-md overflow-hidden bg-canvas border border-line shrink-0">
                    <img
                      src={m.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Map Area */}
      <div className={`flex-1 relative bg-canvas overflow-hidden z-0 w-full h-full min-h-0 ${viewMode === 'list' ? 'hidden' : ''}`}>
        {isLoaded && !loadError && apiKey ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={zoom}
            options={mapOptions}
            onLoad={(map) => setMapInstance(map)}
            /*
              Sync on idle rather than only on drag end: zooming also moves the
              viewport, and when the stored centre drifted from the real one
              the radius circle (drawn at the stored centre) no longer sat
              under the crosshair, so the highlighted area disagreed with the
              cards actually being counted.
            */
            onIdle={() => {
              const next = mapInstance?.getCenter();
              if (!next) return;
              const lat = next.lat();
              const lng = next.lng();
              // Ignore sub-metre jitter, otherwise the controlled `center`
              // prop and this handler bounce off each other forever.
              if (Math.abs(lat - mapCenter.lat) < 1e-6 && Math.abs(lng - mapCenter.lng) < 1e-6) return;
              setMapCenter({ lat, lng });
            }}
          >
            <CircleF
              center={mapCenter}
              radius={radius}
              options={{
                fillColor: '#0A0A0A',
                fillOpacity: 0.08,
                strokeColor: '#0A0A0A',
                strokeOpacity: 0.8,
                strokeWeight: 1,
                clickable: false,
                zIndex: 1,
              }}
            />

            {/* Custom HTML pins: a Marker label can't be styled reliably and
                collided badly once several cards shared an area. */}
            {pins.map((group) => (
              <React.Fragment key={group.key}>
              <OverlayViewF
                position={{ lat: group.lat, lng: group.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                {/*
                  The library forces the overlay container to width:0;height:0
                  for position-based overlays, which makes its
                  getPixelPositionOffset callback receive (0, 0) and resolve to
                  no offset at all. Content then spilled out of that zero-size
                  box, sitting a fixed number of pixels down-and-right of the
                  real coordinate — a constant pixel error that turns into a
                  huge geographic one as you zoom out, so pins looked stuck to
                  the screen. Anchoring in CSS against that 0x0 origin instead
                  keeps the dot exactly on its coordinate at every zoom level.
                */}
                <button
                  onClick={() => setSelectedGroup(group)}
                  className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                >
                  <span className="block w-5 h-5 rounded-full bg-accent border-2 border-white shadow-md" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 max-w-[150px] truncate bg-surface px-2.5 py-1 rounded-full shadow-md border border-line text-[11px] font-bold text-ink whitespace-nowrap">
                    {group.company}
                    {group.members.length > 1 && (
                      <span className="ml-1 text-accent">{group.members.length}</span>
                    )}
                  </span>
                </button>
              </OverlayViewF>
              </React.Fragment>
            ))}

            {selectedGroup && (
              <InfoWindowF
                position={{ lat: selectedGroup.lat, lng: selectedGroup.lng }}
                onCloseClick={() => setSelectedGroup(null)}
              >
                <div className="p-1 min-w-[160px] max-w-[220px]">
                  <p className="font-bold text-sm text-ink mb-1">{selectedGroup.company}</p>
                  {selectedGroup.members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onSelectMeishi?.(m)}
                      className="w-full text-left py-1.5 border-t border-line first:border-t-0 hover:bg-canvas"
                    >
                      <p className="text-xs font-medium text-ink">{m.name}</p>
                      {m.position && <p className="text-[10px] text-ink-muted">{m.position}</p>}
                    </button>
                  ))}
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas p-8 text-center">
            {loadError || !apiKey ? (
              <div className="max-w-xs">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-ink mb-2">地図の読み込みエラー</h3>
                <p className="text-xs text-ink-muted leading-relaxed mb-4 text-left">
                  地図を表示できません。以下の点をご確認ください：<br /><br />
                  1. <strong>APIキーの設定</strong>: 環境変数 <code className="bg-primary-soft px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> が正しく設定されているか。<br />
                  2. <strong>APIの有効化</strong>: Google Cloud Consoleで「<strong>Maps JavaScript API</strong>」が有効になっているか。
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-ink-faint font-medium">地図を読み込んでいます...</p>
              </div>
            )}
          </div>
        )}

        {/* Centre marker for the search origin: a plain thin cross, with no
            ring around it so it can't be mistaken for the radius circle. */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Plus className="w-6 h-6 text-primary/50" strokeWidth={2} />
        </div>

        <div className="absolute top-4 left-4 z-[1000]">
          <button
            aria-label="現在地を表示"
            onClick={handleCurrentLocation}
            className="w-11 h-11 bg-surface rounded-lg shadow-lg flex items-center justify-center border border-primary active:scale-95 transition-transform"
          >
            <Target className="w-7 h-7 text-primary" />
          </button>
        </div>

        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={handleSearchArea}
            disabled={isGeocoding}
            className="bg-surface px-4 py-2.5 rounded-lg shadow-lg border border-primary text-xs font-bold text-primary flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isGeocoding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            この位置で再検索
          </button>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col shadow-lg rounded-lg overflow-hidden border border-line z-[1000]">
          <button
            aria-label="拡大"
            onClick={() => setZoom((prev) => Math.min(prev + 1, 20))}
            className="w-12 h-12 bg-surface flex items-center justify-center text-ink-muted hover:bg-canvas transition-colors border-b border-line"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            aria-label="縮小"
            onClick={() => setZoom((prev) => Math.max(prev - 1, 3))}
            className="w-12 h-12 bg-surface flex items-center justify-center text-ink-muted hover:bg-canvas transition-colors"
          >
            <Minus className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Right: pin grouping toggle + switch to the list page */}
        <div className="absolute bottom-6 right-4 flex gap-3 z-[1000]">
          <button
            onClick={() => setGroupByCompany((prev) => !prev)}
            className={`px-5 py-3 rounded-xl shadow-xl border flex items-center gap-2 text-sm font-bold active:scale-95 transition-transform ${
              groupByCompany
                ? 'bg-primary border-primary text-white'
                : 'bg-surface border-primary text-ink'
            }`}
          >
            {groupByCompany ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {groupByCompany ? '会社' : '個人'}
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="bg-surface px-5 py-3 rounded-xl shadow-xl border border-primary flex items-center gap-2 text-sm font-bold text-ink active:scale-95 transition-transform"
          >
            <ChevronUp className="w-5 h-5 text-primary" />
            リスト
            <span className="text-primary">{meishisInRadius.length}</span>
          </button>
        </div>
      </div>

      {/* Footer status: reports what is actually on the map right now.
          Kept at a low z-index so the location search modal layers above it
          instead of being clipped by it. The list page carries its own
          empty/へ count copy, so the bar is map-only. */}
      <div className={`px-4 py-3 bg-surface flex items-center justify-between border-t border-line shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-20 gap-3 ${viewMode === 'list' ? 'hidden' : ''}`}>
        <div className="min-w-0">
          <p className="text-xs text-ink-muted font-medium">
            {isGeocoding
              ? '名刺の住所を地図上に配置しています...'
              : meishisInRadius.length > 0
                ? `この周辺に ${meishisInRadius.length}件 の名刺があります。`
                : 'この周辺に検索された名刺がありません。'}
          </p>
          {!isGeocoding && (withoutAddress > 0 || geocodeFailures > 0) && (
            <p className="text-[10px] text-ink-faint mt-0.5 truncate">
              住所がない、または特定できない名刺 {withoutAddress + geocodeFailures}件は表示されません。
            </p>
          )}
        </div>
        <button
          onClick={handleSearchArea}
          disabled={isGeocoding || pendingGeocode.length === 0}
          className="bg-primary/5 text-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <RefreshCw className={`w-4 h-4 ${isGeocoding ? 'animate-spin' : ''}`} />
          住所を再取得
        </button>
      </div>

      {/* Location Search Modal */}
      <AnimatePresence>
        {isLocationSearchOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-surface z-[70] flex flex-col max-w-md mx-auto pt-safe"
          >
            <div className="flex items-center justify-between p-4 bg-surface border-b border-line">
              <h2 className="text-lg font-bold text-ink">基準位置変更</h2>
              <button aria-label="閉じる" onClick={() => setIsLocationSearchOpen(false)} className="p-1">
                <X className="w-6 h-6 text-ink" />
              </button>
            </div>

            <div className="p-4 bg-surface border-b border-line">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faint" />
                <input
                  type="text"
                  placeholder="検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-canvas rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface">
              {!searchQuery.trim() ? (
                <div className="h-full flex items-center justify-center p-8 text-center">
                  <p className="text-ink-muted font-medium leading-relaxed">
                    基準位置となる住所または名刺を<br />検索してください
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  <div>
                    <h3 className="text-xs font-medium text-ink-muted mb-3">私の名刺帳内の名刺検索結果</h3>
                    {meishiResults.length === 0 ? (
                      <p className="text-sm text-ink-faint py-2">検索結果がありません。</p>
                    ) : (
                      <div className="space-y-3">
                        {meishiResults.map((meishi) => (
                          <button
                            key={meishi.id}
                            onClick={() => focusOnMeishi(meishi as MappableMeishi)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-canvas rounded-lg text-left transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                              <Briefcase className="w-5 h-5 text-ink-muted" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink truncate">{meishi.company || meishi.name}</p>
                              <p className="text-xs text-ink-muted truncate">{meishi.address || '住所情報なし'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-ink-muted mb-3">住所検索結果</h3>
                    {placesError ? (
                      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                        <p className="text-sm text-danger flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {placesError}
                        </p>
                      </div>
                    ) : addressResults.length === 0 ? (
                      <p className="text-sm text-ink-faint py-2">検索結果がありません。</p>
                    ) : (
                      <div className="space-y-4">
                        {addressResults.map((prediction) => (
                          <button
                            key={prediction.place_id}
                            onClick={() => handleSelectAddress(prediction.place_id, prediction.structured_formatting.main_text)}
                            className="w-full flex items-start gap-4 p-2 hover:bg-canvas rounded-lg text-left transition-colors"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-ink truncate">
                                {prediction.structured_formatting.main_text}
                              </p>
                              <p className="text-sm text-ink-muted truncate mt-0.5">
                                {prediction.structured_formatting.secondary_text}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
