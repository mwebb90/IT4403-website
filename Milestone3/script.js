let allBooks = [];
let currentPage = 1;
const booksPerPage = 10;
$(document).ready(function () {
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
        $("#pagination-container").empty();
        $("#details-section").find(".book-details").remove();
        allBooks = [];
        currentPage = 1;
        $.ajax({
            url: "https://openlibrary.org/search.json",
            method: "GET",
            data: {
                q: searchTerm,
                limit: 50
            },
            dataType: "json",
            success: function (response) {
                allBooks = response.docs || [];
                if (allBooks.length === 0) {
                    $("#search-message").text(
                        "No books found. Try another search."
                    );
                    return;
                }
                $("#search-message").text(
                    "Found " + allBooks.length + " books."
                );
                showPage(1);
            },
            error: function () {
                $("#search-message").text(
                    "Unable to load books. Please try again."
                );
            }
        });
    }
    function showPage(page) {
        const totalPages = Math.ceil(
            allBooks.length / booksPerPage
        );
        if (page < 1 || page > totalPages) {
            return;
        }
        currentPage = page;
        const start = (currentPage - 1) * booksPerPage;
        const end = start + booksPerPage;
        $("#results-section").find(".book-grid").remove();
        displayBooks(allBooks.slice(start, end));
        displayPagination();
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
            } else {
                card.append(
                    $("<p>").text("No cover available")
                );
            }
            card.append($("<h3>").text(title));
            card.append($("<p>").text("By " + author));
            card.css("cursor", "pointer");
            card.attr("tabindex", "0");
            card.attr("role", "button");
            card.on("click", function () {
                loadBookDetails(book);
            });
            card.on("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    loadBookDetails(book);
                }
            });
            bookGrid.append(card);
        });
        $("#results-section").append(bookGrid);
    }
    function loadBookDetails(book) {
        const detailsSection = $("#details-section");
        detailsSection.find(".book-details").remove();
        const details = $("<div>").addClass("book-details");
        details.append(
            $("<p>").text("Loading book details...")
        );
        detailsSection.append(details);
        const workId = book.key;
        if (!workId || !workId.startsWith("/works/")) {
            details.empty().append(
                $("<p>").text("Book details are unavailable.")
            );
            return;
        }
        $.ajax({
            url: "https://openlibrary.org" + workId + ".json",
            method: "GET",
            dataType: "json",
            success: function (response) {
                details.empty();
                const title = response.title || book.title || "Unknown Title";
                details.append($("<h3>").text(title));
                details.append($("<p>").text("Work ID: " + workId));
                if (book.cover_i) {
                    details.append(
                        $("<img>")
                            .attr(
                                "src",
                                "https://covers.openlibrary.org/b/id/" +
                                book.cover_i + "-M.jpg"
                            )
                            .attr("alt", "Cover of " + title)
                    );
                }
                const authors = book.author_name
                    ? book.author_name.join(", ")
                    : "Unknown Author";
                details.append(
                    $("<p>").text("Author(s): " + authors)
                );
                let description = "No description available.";
                if (typeof response.description === "string") {
                    description = response.description;
                } else if (
                    response.description &&
                    response.description.value
                ) {
                    description = response.description.value;
                }
                details.append(
                    $("<p>").text("Description: " + description)
                );
                const subjects = response.subjects || [];
                details.append(
                    $("<h4>").text("Subjects")
                );
                if (subjects.length > 0) {
                    const subjectList = $("<ul>");
                    subjects.slice(0, 10).forEach(function (subject) {
                        subjectList.append(
                            $("<li>").text(subject)
                        );
                    });
                    details.append(subjectList);
                } else {
                    details.append(
                        $("<p>").text("No subjects available.")
                    );
                }
                details.append(
                    $("<a>")
                        .attr(
                            "href",
                            "https://openlibrary.org" + workId
                        )
                        .attr("target", "_blank")
                        .attr("rel", "noopener noreferrer")
                        .text("View on Open Library")
                );
            },
            error: function () {
                details.empty().apend(
                    $("<p>").text(
                        "Unable to load book details. Please try again."
                    )
                );
            }
        });
        detailsSection[0].scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
    function displayPagination() {
        $("#pagination").remove();
        const totalPages = Math.ceil(
            allBooks.length / booksPerPage
        );
        if (totalPages <= 1) {
            return;
        }
        const pagination = $("<div>")
            .attr("id", "pagination")
            .css({
                "display": "flex",
                "justify-content": "center",
                "align-items": "center",
                "gap": "15px",
                "margin": "30px auto",
                "flex-wrap": "wrap"
            });
        const previousButton = $("<button>")
            .attr("type", "button")
            .text("Previous")
            .prop("disabled", currentPage === 1)
            .on("click", function () {
                showPage(currentPage - 1);
            });
        const pageInfo = $("<span>")
            .text(
                "Page " + currentPage + " of " + totalPages
            );
        const nextButton = $("<button>")
            .attr("type", "button")
            .text("Next")
            .prop("disabled", currentPage === totalPages)
            .on("click", function () {
                showPage(currentPage + 1);
            });
        pagination.append(
            previousButton,
            pageInfo,
            nextButton
        );
        $("#pagination-container").empty().append(pagination);
    }
    function loadFeaturedCollection() {
        const section = $("#collection-section");
        section.find(".featured-grid, .collection-message").remove();
        const message = $("<p>")
            .addClass("collection-message")
            .text("Loading fantasy books...");
        section.append(message);
        $.ajax({
            url: "https://openlibrary.org/subjects/fantasy.json",
            method: "GET",
            data: {
                limit: 10
            },
            dataType: "json",
            success: function (response) {
                message.remove();
                const books = response.works || [];
                if (books.length === 0) {
                    section.append(
                        $("<p>")
                            .addClass("collection-message")
                            .text("No featured books available.")
                    );
                    return;
                }
                const grid = $("<div>").addClass("book-grid featured-grid");
                books.slice(0, 10).forEach(function (book) {
                    const title = book.title || "Unknown Title";
                    const authors = (book.authors || [])
                        .map(function (author) {
                            return author.name;
                        })
                        .join(", ") || "Unknown Author";
                    const card = $("<div>").addClass("book-card");
                    if (book.cover_id) {
                        card.append(
                            $("<img>")
                                .attr(
                                    "src",
                                    "https://covers.openlibrary.org/b/id/" +
                                    book.cover_id + "-M.jpg"
                                )
                                .attr("alt", "Cover of " + title)
                        );
                    } else {
                        card.append(
                            $("<p>").text("No cover available")
                        );
                    }
                    card.append($("<h3>").text(title));
                    card.append($("<p>").text("By " + authors));
                    grid.append(card);
                });
                section.append(grid);
            },
            error: function () {
                message.text(
                    "Unable to load featured books. Please try again."
                );
            }
        });
    }
    loadFeaturedCollection();
});
