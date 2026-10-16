"use strict";
// Milestone 2 - Open Library Book Search
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const bookResults = document.getElementById("bookResults");
const message = document.getElementById("message");
const resultsPerPage = document.getElementById("resultsPerPage");
const pageNumber = document.getElementById("pageNumber");
let currentSearch = "";
let currentPage = 1;
const maxResults = 60;
// Search for books using the Open Library API
async function searchBooks() {
    if (!currentSearch) {
        return;
    }
    const pageSize = Number(resultsPerPage.value);
    const totalPages = Math.ceil(maxResults / pageSize);
    message.textContent = "Searching for books...";
    bookResults.innerHTML = "";
    const url =
        "https://openlibrary.org/search.json?q=" +
        encodeURIComponent(currentSearch) +
        "&limit=" + pageSize +
        "&page=" + currentPage;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Unable to retrieve books.");
        }
        const data = await response.json();
        const books = data.docs || [];
        if (books.length === 0) {
            message.textContent = "No books found.";
            updatePages(0);
            return;
        }
        message.textContent = "";
        // Display each book
        for (const book of books) {
            const card = document.createElement("article");
            card.className = "book-card";
            const title = document.createElement("h3");
            const link = document.createElement("a");
            const workId = book.key
                ? book.key.split("/").pop()
                : "";
            link.textContent = book.title || "Untitled Book";
            if (workId) {
                link.href =
                    "details.html?id=" +
                    encodeURIComponent(workId);
            } else {
                link.removeAttribute("href");
            }
            title.appendChild(link);
            const cover = document.createElement("img");
            cover.alt = "Book cover for " +
                (book.title || "Untitled Book");
            if (book.cover_i) {
                cover.src =
                    "https://covers.openlibrary.org/b/id/" +
                    book.cover_i + "-M.jpg";
            } else {
                cover.alt = "Cover not available";
                cover.style.display = "none";
            }
            card.appendChild(cover);
            card.appendChild(title);
            bookResults.appendChild(card);
        }
        const availableResults = Math.min(
            data.numFound ?? data.num_found ?? 0,
            maxResults
        );
        const availablePages = Math.min(
            totalPages,
            Math.ceil(availableResults / pageSize)
        );
        updatePages(availablePages);
    } catch (error) {
        message.textContent =
            "Something went wrong. Please try again.";
        bookResults.innerHTML = "";
        console.error("Search error:", error);
    }
}
// Update the page selection dropdown
function updatePages(totalPages) {
    pageNumber.innerHTML = "";
    for (let page = 1; page <= totalPages; page++) {
        const option = document.createElement("option");
        option.value = page;
        option.textContent = "Page " + page;
        pageNumber.appendChild(option);
    }
    if (totalPages > 0) {
        currentPage = Math.min(currentPage, totalPages);
        pageNumber.value = String(currentPage);
    }
}
// Start a new search
searchForm.addEventListener("submit", function(event) {
    event.preventDefault();
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    if (!currentSearch) {
        message.textContent =
            "Please enter a book title or keyword.";
        return;
    }
    searchBooks();
});
// Change the number of results per page
resultsPerPage.addEventListener("change", function() {
    currentPage = 1;
    if (currentSearch) {
        searchBooks();
    }
});
// Change the selected page
pageNumber.addEventListener("change", function() {
    currentPage = Number(pageNumber.value);
    if (currentSearch) {
        searchBooks();
    }

});
