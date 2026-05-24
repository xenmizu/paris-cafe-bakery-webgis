// ===== INIT MAP =====
const map = L.map('map', {
  center: [48.8566, 2.3522],
  zoom: 13,
  zoomControl: true
});

// ===== BASEMAP =====
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

// ===== CUSTOM ICONS =====
function createIcon(color, borderColor) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:10px; height:10px;
      background:${color};
      border:2px solid ${borderColor};
      border-radius:50%;
      box-shadow:0 1px 3px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8]
  });
}

const cafeIcon = createIcon('#6F4E37', '#3c2415');
const bakeryIcon = createIcon('#E8A87C', '#a0694a');

// ===== LAYER GROUPS =====
const cafeLayer = L.layerGroup().addTo(map);
const bakeryLayer = L.layerGroup().addTo(map);
const mainRoadLayer = L.layerGroup().addTo(map);
const pedestrianLayer = L.layerGroup().addTo(map);

// ===== POPUP BUILDER =====
function buildPopup(props, type) {
  const name = props.name || 'Unnamed';
  const cuisine = props.cuisine || '-';
  const hours = props.opening_hours || '-';
  const street = props['addr:street'] || '-';
  const number = props['addr:housenumber'] || '';
  const address = street !== '-' ? `${street} ${number}`.trim() : '-';
  const badgeClass = type === 'cafe' ? 'badge-cafe' : 'badge-bakery';
  const badgeText = type === 'cafe' ? 'Café' : 'Bakery & Pastry';

  return `
    <div>
      <div class="popup-title">${name}</div>
      <span class="popup-badge ${badgeClass}">${badgeText}</span>
      <div class="popup-row"><span class="popup-key">Cuisine</span><span>${cuisine}</span></div>
      <div class="popup-row"><span class="popup-key">Address</span><span>${address}</span></div>
      <div class="popup-row"><span class="popup-key">Hours</span><span>${hours}</span></div>
    </div>
  `;
}

// ===== LOAD CAFE & BAKERY DATA =====
let allCafeMarkers = [];
let allBakeryMarkers = [];

fetch('cafe_bakery.geojson')
  .then(r => r.json())
  .then(data => {
    data.features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      const latlng = [coords[1], coords[0]];
      const amenity = props.amenity || '';
      const shop = props.shop || '';

      if (amenity === 'cafe') {
        const marker = L.marker(latlng, { icon: cafeIcon })
          .bindPopup(buildPopup(props, 'cafe'));
        allCafeMarkers.push(marker);
        cafeLayer.addLayer(marker);
      } else if (shop === 'bakery' || shop === 'pastry') {
        const marker = L.marker(latlng, { icon: bakeryIcon })
          .bindPopup(buildPopup(props, 'bakery'));
        allBakeryMarkers.push(marker);
        bakeryLayer.addLayer(marker);
      }
    });
  })
  .catch(err => console.error('Error loading cafe_bakery.geojson:', err));

// ===== LOAD ROADS DATA =====
fetch('roads.geojson')
  .then(r => r.json())
  .then(data => {
    data.features.forEach(feature => {
      const props = feature.properties;
      const highway = props.highway || '';

      const isMainRoad = ['motorway','trunk','primary','motorway_link','trunk_link','primary_link'].includes(highway);
      const isPedestrian = ['footway','pedestrian','path','steps'].includes(highway);

      if (isMainRoad) {
        const line = L.geoJSON(feature, {
          style: { color: '#E67E22', weight: 2, opacity: 0.8 }
        }).bindPopup(`<div class="popup-title">${props.name || 'Main Road'}</div><div class="popup-row"><span class="popup-key">Type</span><span>${highway}</span></div>`);
        mainRoadLayer.addLayer(line);
      } else if (isPedestrian) {
        const line = L.geoJSON(feature, {
          style: { color: '#27AE60', weight: 1.2, opacity: 0.7, dashArray: '4,4' }
        }).bindPopup(`<div class="popup-title">${props.name || 'Pedestrian Path'}</div><div class="popup-row"><span class="popup-key">Type</span><span>${highway}</span></div>`);
        pedestrianLayer.addLayer(line);
      }
    });
  })
  .catch(err => console.error('Error loading roads.geojson:', err));

// ===== LAYER TOGGLES =====
document.getElementById('toggle-cafe').addEventListener('change', function() {
  if (this.checked) map.addLayer(cafeLayer);
  else map.removeLayer(cafeLayer);
});

document.getElementById('toggle-bakery').addEventListener('change', function() {
  if (this.checked) map.addLayer(bakeryLayer);
  else map.removeLayer(bakeryLayer);
});

document.getElementById('toggle-roads').addEventListener('change', function() {
  if (this.checked) map.addLayer(mainRoadLayer);
  else map.removeLayer(mainRoadLayer);
});

document.getElementById('toggle-pedestrian').addEventListener('change', function() {
  if (this.checked) map.addLayer(pedestrianLayer);
  else map.removeLayer(pedestrianLayer);
});

// ===== FILTER BUTTONS =====
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    const filter = this.dataset.filter;

    if (filter === 'all') {
      map.addLayer(cafeLayer);
      map.addLayer(bakeryLayer);
      document.getElementById('toggle-cafe').checked = true;
      document.getElementById('toggle-bakery').checked = true;
    } else if (filter === 'cafe') {
      map.addLayer(cafeLayer);
      map.removeLayer(bakeryLayer);
      document.getElementById('toggle-cafe').checked = true;
      document.getElementById('toggle-bakery').checked = false;
    } else if (filter === 'bakery') {
      map.removeLayer(cafeLayer);
      map.addLayer(bakeryLayer);
      document.getElementById('toggle-cafe').checked = false;
      document.getElementById('toggle-bakery').checked = true;
    }
  });
});
