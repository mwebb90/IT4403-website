"use strict";
// Milestone 2 - Open Library Book Details
const detailsMessage = document.getElementById("detailsMessage");
const detailsContent = document.getElementById("detailsContent");
// Get the selected book's Work ID from the URL
const params = new URLSearchParams(window.location.search);
const workId = params.get("id");
// Create a paragraph with a label and value
function addDetail(label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = label + ": ";
    paragraph.appendChild(strong);
    paragraph.appendChild(document.createTextNode(value));
    detailsContent.appendChild(paragraph);
}
// Retrieve the selected book from Open Library
async function loadBookDetails() {
    if (!workId || !/^OL\d+W$/.test(workId)) {
        detailsMessage.textContent =
            "No valid book was selected. Return to Book Search.";
        return;
    }
    detailsMessage.textContent = "Loading book information...";
    const url =
        "https://openlibrary.org/works/" +
        encodeURIComponent(workId) + ".json";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Unable to retrieve book details.");
        }
        const book = await response.json();
        detailsContent.innerHTML = "";
        // Book title
        const title = document.createElement("h2");
        title.textContent = book.title || "Untitled Book";
        detailsContent.appendChild(title);
        // Book cover
        if (book.covers && book.covers.length > 0) {
            const cover = document.createElement("img");
            cover.src =
                "https://covers.openlibrary.org/b/id/" +
                book.covers[0] + "-M.jpg";
            cover.alt = "Cover of " + book.title;
            detailsContent.appendChild(cover);
        } else {
            addDetail("Cover", "Not available");
        }
        // Work ID
        addDetail("Work ID", workId);
        // Book description
        let description = "No description available.";
        if (typeof book.description === "string") {
            description = book.description;
        } else if (
            book.description &&
            typeof book.description.value === "string"
        ) {
            description = book.description.value;
        }
        addDetail("Description", description);
        // Book subjects or genres
        const subjects = Array.isArray(book.subjects)
            ? book.subjects.slice(0, 10).join(", ")
            : "No subjects available.";
        addDetail("Subjects", subjects || "No subjects available.");
        // Link to the original Open Library page
        const linkParagraph = document.createElement("p");
        const link = document.createElement("a");
        link.href =
            "https://openlibrary.org/works/" +
            encodeURIComponent(workId);
        link.textContent = "View this book on Open Library";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        linkParagraph.appendChild(link);
        detailsContent.appendChild(linkParagraph);
        detailsMessage.textContent = "";
    } catch (error) {
        detailsMessage.textContent =
            "Unable to load book details. Please try again later.";
        console.error("Book details error:", error);
    }
}
// Load the book when the page opens
loadBookDetails();
