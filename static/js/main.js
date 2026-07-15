// Initialize the map centered on Nairobi
const map = L.map("map").setView([-1.286389, 36.817223], 11);

// Add OpenStreetMap tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Store all attractions globally
let allAttractions = [];

// Store current map markers
let currentMarkers = [];

// Store current selected category
let selectedCategory = "All";

let activeMarker = null;

// DOM elements
const attractionCount = document.getElementById("attraction-count");
const attractionsList = document.getElementById("attractions-list");
const categoryButtons = document.querySelectorAll(".category-btn");
const clearFilterBtn = document.getElementById("clear-filter-btn");
const attractionPanel = document.getElementById("attraction-panel");
const panelTitle = document.getElementById("panel-title");
const panelCategory = document.getElementById("panel-category");
const panelLocation = document.getElementById("panel-location");
const panelDescription = document.getElementById("panel-description");
const closePanelBtn = document.getElementById("close-panel-btn");
const panelImage = document.getElementById("panel-image");
const panelImagePlaceholder = document.getElementById(
  "panel-image-placeholder",
);
const panelDirections = document.getElementById("panel-directions");

const categoryStyles = {
  "Museum": {
    marker: "#f59e0b",
    pulse: "rgba(245,158,11,.45)",
  },

  "Park / Nature": {
    marker: "#22c55e",
    pulse: "rgba(34,197,94,.45)",
  },

  "Wildlife": {
    marker: "#059669",
    pulse: "rgba(5,150,105,.45)",
  },

  "Cultural / Historical": {
    marker: "#a855f7",
    pulse: "rgba(168,85,247,.45)",
  },
};

// Load attraction data
fetch("/static/data/attractions.json")
  .then((response) => response.json())
  .then((attractions) => {
    allAttractions = attractions;
    renderAttractions(allAttractions);
    updateCount(allAttractions.length);
    updateActiveCategoryButton("All");
  })
  .catch((error) => {
    console.error("Error loading attractions:", error);
  });

function showAttractionPanel(attraction) {
  panelTitle.textContent = attraction.name;
  panelCategory.textContent = attraction.category;
  panelLocation.textContent = attraction.location_area;
  panelDescription.textContent =
    attraction.description || "No description available.";

  // Directions link
  panelDirections.href = `https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`;

  // Handle panel image
  if (attraction.image && attraction.image.trim() !== "") {
    panelImage.src = `/static/${attraction.image}`;
    panelImage.alt = attraction.name;
    panelImage.classList.remove("hidden");
    panelImagePlaceholder.classList.add("hidden");
  } else {
    panelImage.src = "";
    panelImage.alt = "";
    panelImage.classList.add("hidden");
    panelImagePlaceholder.classList.remove("hidden");
  }

  attractionPanel.classList.remove("hidden");
}

function hideAttractionPanel() {
  attractionPanel.classList.add("hidden");
}

// Main render function: updates both map markers and sidebar cards
function renderAttractions(attractions) {
  clearMarkers();
  renderMarkers(attractions);
  renderAttractionCards(attractions);
}

function createMarker(category, active = false) {
  const style = categoryStyles[category] || {
    marker: "#2563eb",
    pulse: "rgba(37, 99, 235, 0.45)"
};
  return L.divIcon({
    className: "",
    html: `
            <div class="custom-marker ${active ? "active-marker" : ""}"
            style="--marker-color: ${style.marker};
    --pulse-color: ${style.pulse};
    ">
            </div>
        `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function setActiveMarker(selectedAttraction) {
  // Reset the previously selected marker
  if (activeMarker) {
    activeMarker.setIcon(createMarker(activeMarker.attractionData.category));
  }

  // Find the marker belonging to this attraction
  const selected = currentMarkers.find(
    (item) => item.attraction.id === selectedAttraction.id,
  );

  if (!selected) return;

  // Replace it with an active version
  selected.marker.setIcon(createMarker(selectedAttraction.category, true));

  activeMarker = selected.marker;
}

// Render markers on the map
function renderMarkers(attractions) {
  attractions.forEach((attraction) => {
    const marker = L.marker([attraction.latitude, attraction.longitude], {
      icon: createMarker(attraction.category),
    }).addTo(map);

    marker.attractionData = attraction;

    marker.on("click", () => {
      showAttractionPanel(attraction);
      setActiveMarker(attraction);
    });

    // Store both the attraction data and its marker together
    currentMarkers.push({
      attraction,
      marker,
    });
  });
}

// Render attraction cards in the sidebar
function renderAttractionCards(attractions) {
  attractionsList.innerHTML = "";

  if (attractions.length === 0) {
    attractionsList.innerHTML = `
            <div class="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
                No attractions found for this category.
            </div>
        `;
    return;
  }

  attractions.forEach((attraction) => {
    const card = document.createElement("button");
    card.className =
      "w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 transition";

    const imageHtml =
      attraction.image && attraction.image.trim() !== ""
        ? `
                    <img 
                        src="/static/${attraction.image}" 
                        alt="${attraction.name}"
                        class="w-20 h-20 rounded-lg object-cover shrink-0"
                    >
                `
        : `
                    <div class="w-20 h-20 rounded-lg bg-slate-200 flex items-center justify-center text-[11px] text-slate-500 shrink-0">
                        No image
                    </div>
                `;

    card.innerHTML = `
            <div class="flex gap-3 items-start">
                ${imageHtml}

                <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-semibold text-slate-800 leading-5">
                        ${attraction.name}
                    </h4>

                    <p class="text-xs text-slate-500 mt-1">
                        ${attraction.location_area}
                    </p>

                    <span class="inline-block mt-2 text-[11px] font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        ${attraction.category}
                    </span>
                </div>
            </div>
        `;

    card.addEventListener("click", () => {
      map.setView([attraction.latitude, attraction.longitude], 14, {
        animate: true,
      });

      showAttractionPanel(attraction);
      setActiveMarker(attraction);
    });

    attractionsList.appendChild(card);
  });
}

// Remove all markers from the map
function clearMarkers() {
  currentMarkers.forEach((item) => {
    map.removeLayer(item.marker);
  });

  currentMarkers = [];
}

// Update attraction count text
function updateCount(count) {
  attractionCount.textContent = `${count} attraction${count !== 1 ? "s" : ""} found`;
}

// Filter attractions by category
function filterAttractions(category) {
  selectedCategory = category;

  let filteredAttractions;

  if (category === "All") {
    filteredAttractions = allAttractions;
  } else {
    filteredAttractions = allAttractions.filter(
      (attraction) => attraction.category === category,
    );
  }

  renderAttractions(filteredAttractions);
  updateCount(filteredAttractions.length);
  updateActiveCategoryButton(category);
}

// Update active category button styling
function updateActiveCategoryButton(activeCategory) {
  categoryButtons.forEach((button) => {
    const buttonCategory = button.dataset.category;

    const check = button.querySelector(".category-check");

    if (buttonCategory === activeCategory) {
      check.classList.remove("bg-white", "border-slate-300");
      check.classList.add("bg-slate-900");

      check.innerHTML = "";
    } else {
      check.classList.remove("bg-slate-900");
      check.classList.add("bg-white", "border-slate-300");

      check.innerHTML = "";
    }
  });
}

// Add click event to each category button
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.category;
    filterAttractions(category);
  });
});

closePanelBtn.addEventListener("click", hideAttractionPanel);

// Clear filter button resets to All
clearFilterBtn.addEventListener("click", () => {
  filterAttractions("All");
});
