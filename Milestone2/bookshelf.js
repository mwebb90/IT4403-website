"use strict";
// Milestone 2 - My Bookshelf
// Featured books loaded from the Open Library API.
// Selected Open Library Work IDs
const bookshelfIds = [
    "OL82563W",   // Harry Potter and the Philosopher's Stone
    "OL45804W",   // Pride and Prejudice
    "OL27448W",   // The Great Gatsby
    "OL1168007W", // The Hobbit
    "OL66554W"    // To Kill a Mockingbird
];
const bookshelfResults =
    document.getElementById("bookshelfResults");
const bookshelfMessage =
    document.getElementById("bookshelfMessage");
// Retrieve one book using its Work ID
async function getBook(workId) {
    const url =
        "https://openlibrary.org/works/" +
        encodeURIComponent(workId) + ".json";
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Could not load book " + workId);
    }
    return response.json();
}
// Create a book card
function createBookCard(book, workId) {
    const card = document.createElement("article");
    card.className = "book-card";
    // Book cover
    if (Array.isArray(book.covers) && book.covers.length > 0) {
        const cover = document.createElement("img");
        cover.src =
            "https://covers.openlibrary.org/b/id/" +
            book.covers[0] + "-M.jpg";
        cover.alt = "Cover of " + (book.title || "Untitled Book");
        cover.loading = "lazy";
        card.appendChild(cover);
    }
    // Book title
    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href =
        "details.html?id=" +
        encodeURIComponent(workId);
    link.textContent = book.title || "Untitled Book";
    title.appendChild(link);
    card.appendChild(title);
    // Work ID
    const idText = document.createElement("p");
    idText.textContent = "Work ID: " + workId;
    card.appendChild(idText);
    // Subjects
    const subjects = document.createElement("p");
    if (Array.isArray(book.subjects) && book.subjects.length > 0) {
        subjects.textContent =
            "Subjects: " + book.subjects.slice(0, 3).join(", ");
    } else {
        subjects.textContent = "Subjects: Not available";
    }
    card.appendChild(subjects);
    // View Details link
    const detailsLink = document.createElement("a");
    detailsLink.href =
        "details.html?id=" +
        encodeURIComponent(workId);
    detailsLink.textContent = "View Book Details";
    card.appendChild(detailsLink);
    return card;
}
// Load all featured books
async function loadBookshelf() {
    bookshelfMessage.textContent = "Loading your bookshelf...";
    bookshelfResults.innerHTML = "";
    const results = await Promise.allSettled(
        bookshelfIds.map(workId => getBook(workId))
    );
    let loadedCount = 0;
    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            const card = createBookCard(
                result.value,
                bookshelfIds[index]
            );
            bookshelfResults.appendChild(card);
            loadedCount++;
        } else {
            console.error(
                "Bookshelf loading error:",
                bookshelfIds[index],
                result.reason
            );
        }
    });
    if (loadedCount === 0) {
        bookshelfMessage.textContent =
            "Unable to load your bookshelf. Please refresh and try again.";
    } else if (loadedCount < bookshelfIds.length) {
        bookshelfMessage.textContent =
            "Some books could not be loaded. Showing available books.";
    } else {
        bookshelfMessage.textContent = "";
    }
}
// Start loading when the page opens
loadBookshelf();
