let allBooks = [];
let currentPage = 1;
const booksPerPage = 10;
$(document).ready(function () {
    const resultsSection = $("#results-section");
    const detailsSection = $("#details-section");
    const collectionSection = $("#collection-section");
    const paginationContainer = $("#pagination-container");
    let searchRequest = null;
    let detailRequest = null;
    $("#search-form").on("submit", function (event) {
        event.preventDefault();
        const term = String($("#search-input").val() || "").trim();
        if (!term) {
            $("#search-message").text("Please enter a book title or keyword.");
            return;
        }
        searchBooks(term);
    });
    function makeCover(coverId, title) {
        if (!coverId) {
            return $("<p>").addClass("no-cover").text("No cover available");
        }
        const image = $("<img>")
            .attr("src", "https://covers.openlibrary.org/b/id/" + encodeURIComponent(coverId) + "-M.jpg?default=false")
            .attr("alt", "Cover of " + title)
            .attr("loading", "lazy");
        image.on("error", function () {
            $(this).replaceWith(
                $("<p>").addClass("no-cover").text("No cover available")
            );
        });
        return image;
    }
    function makeBookCard(book, featured) {
        const title = book.title || "Unknown Title";
        const authors = featured
            ? (book.authors || []).map(function (author) {
                return author.name;
            }).filter(Boolean).join(", ")
            : (book.author_name || []).join(", ");
        const workId = typeof book.key === "string" &&
            /^\/works\/OL\d+W$/.test(book.key) ? book.key : null;
        const card = $("<article>").addClass("book-card");
        card.append(makeCover(featured ? book.cover_id : book.cover_i, title));
        card.append($("<h3>").text(title));
        card.append($("<p>").text("By " + (authors || "Unknown Author")));
        if (workId) {
            const button = $("<button>")
                .attr("type", "button")
                .addClass("details-button")
                .text("View Details")
                .on("click", function () {
                    loadBookDetails(workId, title, authors);
                });
            card.append(button);
        }
        return card;
    }
    function searchBooks(term) {
        if (searchRequest) searchRequest.abort();
        if (detailRequest) detailRequest.abort();
        allBooks = [];
        currentPage = 1;
        resultsSection.find(".book-grid").remove();
        paginationContainer.empty();
        detailsSection.find(".book-detail-content").remove();
        $("#search-message").text("Searching for books...");
        searchRequest = $.ajax({
            url: "https://openlibrary.org/search.json",
            method: "GET",
            dataType: "json",
            data: {
                q: term,
                limit: 50,
                fields: "key,title,author_name,cover_i"
            },
            timeout: 20000,
            success: function (response) {
                allBooks = Array.isArray(response.docs)
                    ? response.docs.slice(0, 50)
                    : [];
                if (!allBooks.length) {
                    $("#search-message").text("No books found. Try another search.");
                    return;
                }
                $("#search-message").text("Showing " + allBooks.length + " books.");
                showPage(1);
            },
            error: function (xhr, status) {
                if (status !== "abort") {
                    $("#search-message").text("Unable to load books. Please try again.");
                }
            },
            complete: function () {
                searchRequest = null;
            }
        });
    }
    function showPage(page) {
        const totalPages = Math.ceil(allBooks.length / booksPerPage);
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        resultsSection.find(".book-grid").remove();
        const grid = $("<div>").addClass("book-grid");
        const start = (page - 1) * booksPerPage;
        allBooks.slice(start, start + booksPerPage).forEach(function (book) {
            grid.append(makeBookCard(book, false));
        });
        resultsSection.append(grid);
        displayPagination(totalPages);
    }
    function displayPagination(totalPages) {
        paginationContainer.empty();
        if (totalPages <= 1) return;
        const pagination = $("<div>")
            .attr("id", "pagination")
            .css({
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "15px",
                margin: "30px auto",
                flexWrap: "wrap"
            });
        const previous = $("<button>")
            .attr("type", "button")
            .text("Previous")
            .prop("disabled", currentPage === 1)
            .on("click", function () {
                showPage(currentPage - 1);
            });
        const info = $("<span>")
            .text("Page " + currentPage + " of " + totalPages);
        const next = $("<button>")
            .attr("type", "button")
            .text("Next")
            .prop("disabled", currentPage === totalPages)
            .on("click", function () {
                showPage(currentPage + 1);
            });
        pagination.append(previous, info, next);
        paginationContainer.append(pagination);
    }
    function loadBookDetails(workId, fallbackTitle, fallbackAuthors) {
        if (detailRequest) detailRequest.abort();
        detailsSection.find(".book-detail-content").remove();
        const content = $("<div>").addClass("book-detail-content");
        content.append($("<p>").text("Loading book details..."));
        detailsSection.append(content);
        detailsSection[0].scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
        detailRequest = $.ajax({
            url: "https://openlibrary.org" + workId + ".json",
            method: "GET",
            dataType: "json",
            timeout: 20000,
            success: function (work) {
                content.empty();
                const title = work.title || fallbackTitle || "Unknown Title";
                const coverId = Array.isArray(work.covers) && work.covers.length
                    ? work.covers[0]
                    : null;
                content.append($("<h3>").text(title));
                content.append(makeCover(coverId, title));
                content.append($("<p>").text("Work ID: " + workId.split("/").pop()));
                const authorLine = $("<p>")
                    .text("Authors: " + (fallbackAuthors || "Loading..."));
                content.append(authorLine);
                const authorKeys = (work.authors || []).map(function (entry) {
                    return entry && entry.author && entry.author.key;
                }).filter(function (key) {
                    return typeof key === "string" &&
                        /^\/authors\/OL\d+A$/.test(key);
                }).slice(0, 10);
                if (authorKeys.length) {
                    Promise.all(authorKeys.map(function (key) {
                        return new Promise(function (resolve) {
                            $.ajax({
                                url: "https://openlibrary.org" + key + ".json",
                                dataType: "json",
                                timeout: 12000
                            })
                            .done(function (author) {
                                resolve(author.name || "Unknown Author");
                            })
                            .fail(function () {
                                resolve(null);
                            });
                        });
                    })).then(function (names) {
                        if (!$.contains(document, content[0])) return;
                        const authors = names.filter(Boolean).join(", ") ||
                            fallbackAuthors || "Unknown Author";
                        authorLine.text("Authors: " + authors);
                    });
                } else {
                    authorLine.text("Authors: " + (fallbackAuthors || "Unknown Author"));
                }
                let description = work.description;
                if (description && typeof description === "object") {
                    description = description.value;
                }
                content.append(
                    $("<p>").text("Description: " +
                        (description || "No description available."))
                );
                content.append($("<h4>").text("Subjects"));
                const subjects = Array.isArray(work.subjects)
                    ? work.subjects.slice(0, 10)
                    : [];
                if (subjects.length) {
                    const list = $("<ul>");
                    subjects.forEach(function (subject) {
                        list.append($("<li>").text(subject));
                    });
                    content.append(list);
                } else {
                    content.append($("<p>").text("No subjects available."));
                }
                content.append(
                    $("<a>")
                        .attr("href", "https://openlibrary.org" + workId)
                        .attr("target", "_blank")
                        .attr("rel", "noopener noreferrer")
                        .text("View on Open Library")
                );
            },
            error: function (xhr, status) {
                if (status !== "abort") {
                    content.empty().append(
                        $("<p>").text("Unable to load book details. Please try again.")
                    );
                }
            },
            complete: function () {
                detailRequest = null;
            }
        });
    }
    function loadFeaturedCollection() {
        collectionSection.find(".featured-grid, .collection-message").remove();
        const message = $("<p>")
            .addClass("collection-message")
            .text("Loading fantasy books...");
        collectionSection.append(message);
        $.ajax({
            url: "https://openlibrary.org/subjects/fantasy.json",
            method: "GET",
            dataType: "json",
            data: {
                limit: 10
            },
            timeout: 20000,
            success: function (response) {
                message.remove();
                const books = Array.isArray(response.works)
                    ? response.works.slice(0, 10)
                    : [];
                if (!books.length) {
                    collectionSection.append(
                        $("<p>")
                            .addClass("collection-message")
                            .text("No featured books available.")
                    );
                    return;
                }
                const grid = $("<div>").addClass("book-grid featured-grid");
                books.forEach(function (book) {
                    grid.append(makeBookCard(book, true));
                });
                collectionSection.append(grid);
            },
            error: function () {
                message.text("Unable to load featured books. Please try again.");
            }
        });
    }
    loadFeaturedCollection();
});
