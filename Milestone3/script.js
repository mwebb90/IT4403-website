let allBooks = [];
let currentPage = 1;
const booksPerPage = 10;
$(document).ready(function () {
    // Search for books when the form is submitted.
    $("#search-form").on("submit", function (event) {
        event.preventDefault();
        const searchTerm = $("#search-input").val().trim();
        if (searchTerm === "") {
            $("#search-message").text("Please enter a book title.");
            return;
        }
        searchBooks(searchTerm);
    });
    function searchBooks(searchTerm) {
        $("#search-message").text("Searching for books...");
        $("#results-section").find(".book-grid").remove();
        $.ajax({
            url: "https://openlibrary.org/search.json",
            method: "GET",
            data: {
                q: searchTerm,
                limit: 50
            },
            dataType: "json",
            success: function (response) {
                const books = response.docs || [];
                if (books.length === 0) {
                    $("#search-message").text(
                        "No books found. Try another search."
                    );
                    return;
                }
                $("#search-message").text(
                    "Found " + books.length + " books."
                );
                allBooks = books;
                currentPage = 1;
                displayBooks(allBooks.slice(0,booksPerPage));
            },
            error: function () {
                $("#search-message").text(
                    "Unable to load books. Please try again."
                );
            }
        });
    }
    function displayBooks(books) {
        const bookGrid = $("<div>").addClass("book-grid");
        books.forEach(function (book) {
            const title = book.title || "Unknown Title";
            const author = book.author_name
                ? book.author_name.join(", ")
                : "Unknown Author";
            const card = $("<div>").addClass("book-card");
            if (book.cover_i) {
                const cover = $("<img>")
                    .attr(
                        "src",
                        "https://covers.openlibrary.org/b/id/" +
                        book.cover_i + "-M.jpg"
                    )
                    .attr("alt", "Cover of " + title);
                card.append(cover);
            }
            card.append($("<h3>").text(title));
            card.append($("<p>").text("By " + author));
            bookGrid.append(card);
        });
    $("#results-section").append(bookGrid);
        displayPagination();
    }
function showPage(page) {
    const totalPages = Math.ceil(allBooks.length / booksPerPage);
    if (page < 1 || page > totalPages) {
        return;
    }
    currentPage = page;
    const start = (currentPage - 1) * booksPerPage;
    const end = start + booksPerPage;
    $("#results-section").find(".book-grid").remove();
    displayBooks(allBooks.slice(start, end));
}
function displayPagination() {
    $("#pagination").remove();
    const totalPages = Math.ceil(allBooks.length / booksPerPage);
    if (totalPages <= 1) {
        return;
    }
    const pagination = $("<div>").attr("id", "pagination");
    const previousButton = $("<button>")
        .text("Previous")
        .prop("disabled", currentPage === 1)
        .on("click", function () {
            showPage(currentPage - 1);
        });
    const pageInfo = $("<span>")
        .text(" Page " + currentPage + " of " + totalPages + " ");
    const nextButton = $("<button>")
        .text("Next")
        .prop("disabled", currentPage === totalPages)
        .on("click", function () {
            showPage(currentPage + 1);
        });
    pagination.append(previousButton, pageInfo, nextButton);
    $("#results-section").append(pagination);
}
});
