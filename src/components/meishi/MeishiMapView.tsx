import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Loader2, Check, ArrowLeft, ChevronDown, X, MapPin, AlertCircle, Target, RefreshCw, Minus, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useJsApiLoader, Marker as GoogleMarker, InfoWindow, Circle } from '@react-google-maps/api';
import type { Meishi } from '../../types/app';

export const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export const MeishiMapView: React.FC<{ onBack: () => void, meishis: Meishi[] }> = ({ onBack, meishis }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 35.6894, lng: 139.6917 }); // Tokyo Metropolitan Government Building
  const [zoom, setZoom] = useState(15);
  const [selectedMeishi, setSelectedMeishi] = useState<Meishi | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [radius, setRadius] = useState<number>(500);
  const [isRadiusDropdownOpen, setIsRadiusDropdownOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
  const [locationName, setLocationName] = useState("東京都庁");
  const [searchQuery, setSearchQuery] = useState("");
  const [addressResults, setAddressResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [meishiResults, setMeishiResults] = useState<Meishi[]>([]);

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Error getting current location, using default (Tokyo):", error);
          // 기본 위치(도쿄도청) 유지
          setMapCenter({ lat: 35.6894, lng: 139.6917 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const meishisWithCoords = React.useMemo(() => {
    return meishis.map((m, i) => ({
      ...m,
      lat: m.lat || 35.6894 + (Math.random() - 0.5) * 0.005,
      lng: m.lng || 139.6917 + (Math.random() - 0.5) * 0.005,
    }));
  }, [meishis]);

  // Haversine formula to calculate distance between two points in meters
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const filteredMeishis = React.useMemo(() => {
    return meishisWithCoords.filter(m => {
      if (!m.lat || !m.lng) return false;
      const dist = getDistance(mapCenter.lat, mapCenter.lng, m.lat, m.lng);
      return dist <= radius;
    });
  }, [meishisWithCoords, mapCenter, radius]);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '400px'
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: 'greedy',
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "transit",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  const handleSearchArea = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1500);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationName("現在地");
          setZoom(15);
        },
        (error) => {
          console.warn("Error getting current location:", error);
          alert("現在地を取得できませんでした。位置情報へのアクセスが許可されているか確認してください。");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("お使いのブラウザは位置情報機能をサポートしていません。");
    }
  };

  const [placesError, setPlacesError] = useState<string | null>(null);

  // Google Places Autocomplete Search
  useEffect(() => {
    if (!isLoaded || !searchQuery.trim()) {
      setAddressResults([]);
      setMeishiResults([]);
      setPlacesError(null);
      return;
    }

    const timer = setTimeout(() => {
      // Search Meishis
      const lowerQuery = searchQuery.toLowerCase();
      const filteredMeishis = meishisWithCoords.filter(m => 
        m.company?.toLowerCase().includes(lowerQuery) || 
        m.name.toLowerCase().includes(lowerQuery) ||
        m.address?.toLowerCase().includes(lowerQuery)
      );
      setMeishiResults(filteredMeishis);

      // Search Addresses
      try {
        if (!window.google?.maps?.places) {
          setPlacesError("Places APIが読み込まれていません。");
          return;
        }
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
          { input: searchQuery, componentRestrictions: { country: 'jp' } },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setAddressResults(predictions);
              setPlacesError(null);
            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setAddressResults([]);
              setPlacesError(null);
            } else {
              setAddressResults([]);
              if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                setPlacesError("Google Cloud Consoleで「Places API」を有効にしてください。");
              } else if (status === window.google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR) {
                setPlacesError("Places APIが有効になっていない可能性があります。Google Cloud Consoleを確認してください。");
              } else {
                setPlacesError(`検索エラーが発生しました (${status})`);
              }
            }
          }
        );
      } catch (err) {
        console.error("Error in Places Autocomplete:", err);
        setPlacesError("検索中にエラーが発生しました。");
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, isLoaded, meishisWithCoords]);

  const handleSelectAddress = (placeId: string, mainText: string) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setLocationName(mainText); // Use main text directly as name
        setIsLocationSearchOpen(false);
        setSearchQuery("");
      } else {
        if (status === google.maps.GeocoderStatus.REQUEST_DENIED || status === google.maps.GeocoderStatus.UNKNOWN_ERROR) {
          alert("Geocoding APIが有効になっていません。Google Cloud Consoleで「Geocoding API」を有効にしてください。");
        } else {
          alert(`住所の詳細を取得できませんでした。(${status})`);
        }
        console.error("Geocoding error:", status);
      }
    });
  };

  const handleSelectMeishiLocation = (meishi: Meishi) => {
    if (meishi.lat && meishi.lng) {
      setMapCenter({ lat: meishi.lat, lng: meishi.lng });
      setLocationName(meishi.company || meishi.name);
      setIsLocationSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[60] flex flex-col max-w-md mx-auto shadow-2xl pt-safe"
    >
      {/* Header */}
      <div className="flex items-center p-4 bg-white">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="ml-4 text-lg font-bold text-gray-900">名刺地図</h1>
      </div>

      {/* Filters Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#f5f5f5] border-b border-gray-200 relative z-20">
        <button 
          onClick={() => setIsLocationSearchOpen(true)}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 max-w-[50%] truncate"
        >
          <span className="truncate">{locationName}</span>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
        <div className="relative">
          <button 
            onClick={() => setIsRadiusDropdownOpen(!isRadiusDropdownOpen)}
            className="flex items-center gap-1 text-sm font-medium text-gray-700"
          >
            <span>半径 {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {/* Radius Dropdown */}
          <AnimatePresence>
            {isRadiusDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsRadiusDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                >
                  {/* Triangle pointer */}
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45" />
                  
                  <div className="relative bg-white z-10">
                    {[
                      { label: '500m', value: 500 },
                      { label: '1km', value: 1000 },
                      { label: '2km', value: 2000 },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRadius(option.value);
                          setIsRadiusDropdownOpen(false);
                          if (option.value === 500) setZoom(15);
                          else if (option.value === 1000) setZoom(14);
                          else if (option.value === 2000) setZoom(13);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left text-base hover:bg-gray-50 transition-colors ${
                          radius === option.value ? 'text-gray-900 font-medium' : 'text-gray-700'
                        } ${option.value !== 2000 ? 'border-b border-gray-100' : ''}`}
                      >
                        <span>{option.label}</span>
                        {radius === option.value && <Check className="w-5 h-5 text-[#0A0A0A]" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#f8f8f8] overflow-hidden z-0 w-full h-full min-h-0">
        {isLoaded && !loadError && apiKey ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={zoom}
            options={mapOptions}
            onLoad={(map) => setMapInstance(map)}
            onDragEnd={() => {
              if (mapInstance) {
                const newCenter = mapInstance.getCenter();
                if (newCenter) {
                  setMapCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
                }
              }
            }}
          >
            <Circle
              center={mapCenter}
              radius={radius}
              options={{
                fillColor: '#0A0A0A',
                fillOpacity: 0.1,
                strokeColor: '#0A0A0A',
                strokeOpacity: 0.8,
                strokeWeight: 1,
                clickable: false,
                zIndex: 1
              }}
            />
            {filteredMeishis.map((m) => (
              <GoogleMarker
                key={m.id}
                position={{ lat: m.lat!, lng: m.lng! }}
                onClick={() => setSelectedMeishi(m)}
                icon={{
                  url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                  scaledSize: new google.maps.Size(30, 30),
                }}
                label={{
                  text: m.company || '',
                  className: 'bg-white px-2 py-1 rounded-full shadow-md border border-gray-200 text-[10px] font-bold text-gray-800 -translate-y-10',
                }}
              />
            ))}

            {selectedMeishi && (
              <InfoWindow
                position={{ lat: selectedMeishi.lat!, lng: selectedMeishi.lng! }}
                onCloseClick={() => setSelectedMeishi(null)}
              >
                <div className="p-1 min-w-[120px]">
                  <p className="font-bold text-sm text-gray-900">{selectedMeishi.name}</p>
                  <p className="text-xs text-gray-500">{selectedMeishi.company}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{selectedMeishi.position}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
            {loadError || !apiKey ? (
              <div className="max-w-xs">
                <div className="w-16 h-16 bg-[#0A0A0A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-[#0A0A0A]" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">地図の読み込みエラー</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4 text-left">
                  地図を表示できません。以下の点をご確認ください：<br/><br/>
                  1. <strong>APIキーの設定</strong>: 環境変数 <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> が正しく設定されているか。<br/>
                  2. <strong>APIの有効化</strong>: Google Cloud Consoleで「<strong>Maps JavaScript API</strong>」が有効になっているか。
                </p>
                <div className="p-3 bg-white rounded-xl border border-dashed border-gray-300 text-left">
                  <p className="text-[10px] text-gray-400 font-mono break-all">
                    ※ ApiNotActivatedMapError が発生した場合は、Google Cloud Consoleの「APIとサービス」から「Maps JavaScript API」を有効にしてください。
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#0A0A0A] mx-auto mb-4" />
                <p className="text-sm text-gray-400 font-medium">地図を読み込んでいます...</p>
              </div>
            )}
          </div>
        )}

        {/* Center Search Radius Indicator (Mock) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full border-2 border-[#0A0A0A]/30 bg-[#0A0A0A]/5 flex items-center justify-center">
            <div className="w-1 h-4 bg-[#0A0A0A]/40 absolute"></div>
            <div className="h-1 w-4 bg-[#0A0A0A]/40 absolute"></div>
          </div>
        </div>

        {/* Top Left: Current Location */}
        <div className="absolute top-4 left-4 z-[1000]">
          <button 
            onClick={handleCurrentLocation}
            className="w-11 h-11 bg-white rounded-lg shadow-lg flex items-center justify-center border border-[#0A0A0A] active:scale-95 transition-transform"
          >
            <Target className="w-7 h-7 text-[#0A0A0A]" />
          </button>
        </div>

        {/* Top Right: Search this area */}
        <div className="absolute top-4 right-4 z-[1000]">
          <button 
            onClick={handleSearchArea}
            disabled={isSearching}
            className="bg-white px-4 py-2.5 rounded-lg shadow-lg border border-[#0A0A0A] text-xs font-bold text-[#0A0A0A] flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-[#0A0A0A]/40 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-[#0A0A0A] rounded-full"></div>
              </div>
            )}
            この位置で再検索
          </button>
        </div>

        {/* Middle Right: Zoom Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col shadow-lg rounded-lg overflow-hidden border border-gray-200 z-[1000]">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 1, 20))}
            className="w-12 h-12 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 1, 3))}
            className="w-12 h-12 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Minus className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Right: Action Buttons */}
        <div className="absolute bottom-6 right-4 flex gap-3 z-[1000]">
          <button className="bg-white px-6 py-3 rounded-xl shadow-xl border border-[#0A0A0A] flex items-center gap-2.5 text-sm font-bold text-gray-800 active:scale-95 transition-transform">
            <div className="w-4 h-4 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]"></div>
            </div>
            会社
          </button>
          <button 
            onClick={onBack}
            className="bg-white px-6 py-3 rounded-xl shadow-xl border border-[#0A0A0A] flex items-center gap-2.5 text-sm font-bold text-gray-800 active:scale-95 transition-transform"
          >
            <ChevronUp className="w-5 h-5 text-[#0A0A0A]" />
            リスト
          </button>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="p-4 bg-white flex items-center justify-between border-t border-gray-100 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-[1000]">
        <span className="text-xs text-gray-600 font-medium">この周辺に検索された名刺がありません。</span>
        <button className="bg-[#0A0A0A]/5 text-[#0A0A0A] px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 opacity-80 cursor-not-allowed">
          <RefreshCw className="w-4 h-4" />
          さらに読み込む
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
            className="fixed inset-0 bg-white z-[70] flex flex-col max-w-md mx-auto pt-safe"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">基準位置変更</h2>
              <button onClick={() => setIsLocationSearchOpen(false)} className="p-1">
                <X className="w-6 h-6 text-gray-900" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 bg-white border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/20"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto bg-white">
              {!searchQuery.trim() ? (
                <div className="h-full flex items-center justify-center p-8 text-center">
                  <p className="text-gray-500 font-medium leading-relaxed">
                    基準位置となる住所または名刺を<br />検索してください
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {/* Meishi Results */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-3">私の名刺帳内の名刺検索結果</h3>
                    {meishiResults.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">検索結果がありません。</p>
                    ) : (
                      <div className="space-y-3">
                        {meishiResults.map((meishi) => (
                          <button
                            key={meishi.id}
                            onClick={() => handleSelectMeishiLocation(meishi)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-[#0A0A0A]/10 flex items-center justify-center shrink-0">
                              <Briefcase className="w-5 h-5 text-[#0A0A0A]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{meishi.company || meishi.name}</p>
                              <p className="text-xs text-gray-500">{meishi.address || '住所情報なし'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Address Results */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-3">住所検索結果</h3>
                    {placesError ? (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {placesError}
                        </p>
                      </div>
                    ) : addressResults.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">検索結果がありません。</p>
                    ) : (
                      <div className="space-y-4">
                        {addressResults.map((prediction) => (
                          <button
                            key={prediction.place_id}
                            onClick={() => handleSelectAddress(prediction.place_id, prediction.structured_formatting.main_text)}
                            className="w-full flex items-start gap-4 p-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                          >
                            <div className="w-12 h-12 rounded-full bg-[#0A0A0A] flex items-center justify-center shrink-0 mt-1">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 truncate">
                                {prediction.structured_formatting.main_text}
                              </p>
                              <p className="text-sm text-gray-600 truncate mt-0.5">
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
