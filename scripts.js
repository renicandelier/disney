document.addEventListener("DOMContentLoaded", () => {
    const fallbackImage = 'https://via.placeholder.com/300x170?text=No+Image'; // Fallback placeholder image

    // Function to fetch JSON data
    async function fetchData(url) {
        try {
            showLoadingSpinner();
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load data. Please try again later.');
        } finally {
            hideLoadingSpinner();
        }
    }

    // Function to fetch additional data for SetRefs
    async function fetchSetData(refId) {
        const url = `https://cd-static.bamgrid.com/dp-117731241344/sets/${refId}.json`;
        return await fetchData(url);
    }

    // Function to create and append tiles with images to the DOM
    async function createTiles(containerId, items) {
        const container = document.getElementById(containerId);
        container.innerHTML = ""; // Clear any existing content

        for (const item of items) {
            let tile;
            let imageUrl = '';
            let title = 'No Title';

            if (item.type === 'SetRef') {
                const setData = await fetchSetData(item.set.refId);
                const setItems = setData?.data?.StandardCollection?.items || [];

                for (const setItem of setItems) {
                    imageUrl = getImageUrl(setItem);
                    title = getTitle(setItem);
                    console.log(`SetRef - Title: ${title}, Image URL: ${imageUrl}`);
                    tile = createTile(imageUrl, title);
                    container.appendChild(tile);
                }
            } else {
                imageUrl = getImageUrl(item);
                title = getTitle(item);
                console.log(`Direct Item - Title: ${title}, Image URL: ${imageUrl}`);
                tile = createTile(imageUrl, title);
                container.appendChild(tile);
            }

            // Fallback if imageUrl is missing
            if (!imageUrl) {
                imageUrl = fallbackImage;
                console.warn(`Image missing for title: ${title}, using fallback image.`);
            }
        }
    }

    // Function to create an individual tile
    function createTile(imageUrl, title) {
        const tile = document.createElement('div');
        tile.classList.add('tile');

        const img = document.createElement('img');
        img.src = imageUrl || fallbackImage;
        img.alt = title;

        // Handle broken image links
        img.onerror = () => {
            img.src = fallbackImage;
            img.alt = 'Image not available';
        };

        tile.appendChild(img);
        return tile;
    }

    // Function to get the image URL from the item
    function getImageUrl(item) {
        // Priority: tile > hero_tile > other image types
        let imageUrl = item?.image?.tile?.["1.78"]?.default?.default?.url ||
                       item?.image?.tile?.["1.78"]?.program?.default?.url ||
                       item?.image?.tile?.["1.78"]?.series?.default?.url ||
                       item?.image?.hero_tile?.["1.78"]?.default?.default?.url ||
                       item?.image?.hero_tile?.["1.78"]?.program?.default?.url ||
                       item?.image?.hero_tile?.["1.78"]?.series?.default?.url;

        if (!imageUrl) {
            console.warn(`No image found for item with title: ${getTitle(item)}`);
        }

        return imageUrl;
    }

    // Function to get the title from the item
    function getTitle(item) {
        return item?.text?.title?.full?.collection?.default?.content ||
               item?.text?.title?.full?.program?.default?.content ||
               item?.text?.title?.full?.series?.default?.content ||
               'No Title';
    }

    // Function to create and render sections
    async function createSections(data) {
        const homeContainer = document.getElementById("home-container");
        homeContainer.innerHTML = ''; // Clear the container

        // Loop over each container (section) in the data
        for (const container of data.containers) {
            const sectionTitle = container.set.text.title.full.set.default.content;

            const sectionElement = document.createElement("div");
            sectionElement.className = "section";

            const titleElement = document.createElement("h2");
            titleElement.textContent = sectionTitle;
            sectionElement.appendChild(titleElement);

            const rowElement = document.createElement("div");
            rowElement.className = "row";
            rowElement.id = `section-${data.containers.indexOf(container)}`;

            sectionElement.appendChild(rowElement);
            homeContainer.appendChild(sectionElement);

            await createTiles(rowElement.id, container.set.items);
        }
    }

    // Function to show loading spinner
    function showLoadingSpinner() {
        document.getElementById('loading-spinner').classList.remove('hidden');
    }

    // Function to hide loading spinner
    function hideLoadingSpinner() {
        document.getElementById('loading-spinner').classList.add('hidden');
    }

    // Function to show error message
    function showError(message) {
        const homeContainer = document.getElementById("home-container");
        homeContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }

    // Fetch and render the home page data
    fetchData('https://cd-static.bamgrid.com/dp-117731241344/home.json').then(data => {
        if (data && data.data && data.data.StandardCollection) {
            createSections(data.data.StandardCollection);
        } else {
            showError('The expected data structure was not found.');
        }
    });
});
