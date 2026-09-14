/* psdocs · app.js — banner, drawer, theme toggle, copy-md, toc-highlight */
(function () {
  "use strict";

  // ---- Banner dismiss --------------------------------------------------
  function initBanner() {
    var btn = document.querySelector("[data-ps-banner-close]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var banner = btn.closest("[data-ps-banner]");
      if (banner) banner.style.display = "none";
      try { localStorage.setItem("ps-banner-dismissed", "1"); } catch (e) {}
      document.documentElement.dataset.bannerHidden = "1";
    });
  }

  // ---- Sidebar tree ----------------------------------------------------
  // Normalize Sphinx's mixed toctree markup so caption categories and regular
  // parent pages use the same collapsible tree-node interaction.
  function initSidebarCollapse() {
    var tree = document.querySelector(".ps-tree");
    if (!tree) return;
    var captions = tree.querySelectorAll(":scope > p.caption, :scope > .caption");
    var chevronSVG =
      '<svg class="ps-chevron" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path fill="currentColor" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/>' +
      "</svg>";

    function directChild(parent, tagName) {
      tagName = tagName.toUpperCase();
      for (var i = 0; i < parent.children.length; i += 1) {
        if (parent.children[i].tagName === tagName) return parent.children[i];
      }
      return null;
    }

    function setExpanded(trigger, list, state) {
      trigger.setAttribute("aria-expanded", state ? "true" : "false");
      list.classList.toggle("ps-collapsed", !state);
    }

    captions.forEach(function (cap) {
      var list = cap.nextElementSibling;
      if (!list || list.tagName !== "UL") return;
      var label = cap.textContent.trim();
      var firstItem = list.firstElementChild;
      if (firstItem && firstItem.tagName === "LI") {
        var firstLink = directChild(firstItem, "a");
        var nested = directChild(firstItem, "ul");
        if (firstLink && nested && firstLink.textContent.trim() === label) {
          var insertBefore = firstItem;
          if (firstLink.classList.contains("current")) {
            cap.classList.add("current");
          }
          while (nested.firstChild) {
            list.insertBefore(nested.firstChild, insertBefore);
          }
          firstItem.remove();
        }
      }
      cap.classList.add("ps-tree-row", "ps-tree-row--category");
      cap.insertAdjacentHTML("beforeend", chevronSVG);
      cap.setAttribute("role", "button");
      cap.setAttribute("tabindex", "0");
      var expanded = cap.classList.contains("current") || !!list.querySelector("a.current");
      setExpanded(cap, list, expanded);
      function toggle() { setExpanded(cap, list, cap.getAttribute("aria-expanded") !== "true"); }
      cap.addEventListener("click", toggle);
      cap.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });

    tree.querySelectorAll("li").forEach(function (item) {
      var link = directChild(item, "a");
      var list = directChild(item, "ul");
      if (!link || !list || item.querySelector(":scope > .ps-tree-row")) return;
      var row = document.createElement("div");
      row.className = "ps-tree-row ps-tree-row--page";
      row.insertAdjacentHTML("afterbegin", chevronSVG);
      item.insertBefore(row, link);
      row.appendChild(link);

      var toggle = row.querySelector(".ps-chevron");
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-label", "展开/收起 " + link.textContent.trim());
      var expanded = link.classList.contains("current") || !!list.querySelector("a.current");
      setExpanded(row, list, expanded);
      function toggleList(e) {
        e.preventDefault();
        e.stopPropagation();
        setExpanded(row, list, row.getAttribute("aria-expanded") !== "true");
      }
      toggle.addEventListener("click", toggleList);
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") toggleList(e);
      });
    });
  }

  // ---- Mobile drawer ---------------------------------------------------
  function initDrawer() {
    var toggle = document.querySelector("[data-ps-drawer-toggle]");
    if (!toggle) return;
    var html = document.documentElement;
    toggle.addEventListener("click", function () {
      var open = html.dataset.drawerOpen === "true";
      html.dataset.drawerOpen = open ? "false" : "true";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") html.dataset.drawerOpen = "false";
    });
    document.addEventListener("click", function (e) {
      if (html.dataset.drawerOpen !== "true") return;
      if (e.target.closest(".ps-sidebar") || e.target.closest("[data-ps-drawer-toggle]")) return;
      html.dataset.drawerOpen = "false";
    });
  }

  // ---- Language switcher ----------------------------------------------
  function initLanguageSwitcher() {
    var switcher = document.querySelector("[data-ps-lang-switcher]");
    if (!switcher) return;
    var toggle = switcher.querySelector("[data-ps-lang-toggle]");
    var menu = switcher.querySelector("[data-ps-lang-menu]");
    if (!toggle || !menu) return;

    function setOpen(state) {
      switcher.dataset.open = state ? "true" : "false";
      toggle.setAttribute("aria-expanded", state ? "true" : "false");
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(switcher.dataset.open !== "true");
    });
    document.addEventListener("click", function (e) {
      if (!switcher.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // ---- Search modal ---------------------------------------------------
  function initSearchModal() {
    var search = document.querySelector("[data-ps-search]");
    var modal = document.querySelector("[data-ps-search-modal]");
    if (!search || !modal) return;
    var headerInput = search.querySelector(".ps-search__input");
    var headerPrompt = search.querySelector("[data-ps-search-header-prompt]");
    var headerQuery = search.querySelector("[data-ps-search-header-query]");
    var modalForm = modal.querySelector("[data-ps-search-modal-form]");
    var modalInput = modal.querySelector("[data-ps-search-modal-input]");
    var dialog = modal.querySelector(".ps-search-modal__dialog");
    var choices = modal.querySelector(".ps-search-modal__choices");
    var emptyPanel = modal.querySelector("[data-ps-search-empty]");
    var exampleButtons = modal.querySelectorAll("[data-ps-search-example]");
    var docSearch = modal.querySelector("[data-ps-search-docs]");
    var aiSearch = modal.querySelector("[data-ps-search-ai]");
    var aiQueryRow = modal.querySelector("[data-ps-ai-query-row]");
    var aiLoading = modal.querySelector("[data-ps-ai-loading]");
    var answer = modal.querySelector("[data-ps-ai-answer]");
    var answerText = modal.querySelector("[data-ps-ai-answer-text]");
    var sources = modal.querySelector("[data-ps-ai-sources]");
    var sourcesList = modal.querySelector("[data-ps-ai-sources-list]");
    var notice = modal.querySelector("[data-ps-ai-notice]");
    var retention = modal.querySelector("[data-ps-ai-retention]");
    var querySlots = modal.querySelectorAll("[data-ps-search-query], [data-ps-ai-query]");
    var suppressNextFocus = false;
    if (!headerInput || !modalForm || !modalInput || !docSearch || !aiSearch) return;

    function query() { return modalInput.value.trim(); }

    function setDialogExpanded(expanded) {
      if (!dialog) return;
      dialog.classList.toggle("ps-search-modal__dialog--expanded", !!expanded);
      dialog.classList.toggle("ps-search-modal__dialog--compact", !expanded);
    }

    function setNotice(kind) {
      if (!notice) return;
      notice.textContent = notice.getAttribute("data-" + kind) || "";
    }

    function setQueryText() {
      var value = query() || modalInput.getAttribute("placeholder") || "";
      querySlots.forEach(function (slot) { slot.textContent = value; });
    }

    function syncHeaderQuery() {
      var value = (headerInput.value || "").trim();
      if (headerQuery) {
        headerQuery.textContent = value;
        headerQuery.hidden = !value;
      }
      if (headerPrompt) headerPrompt.hidden = !!value;
    }

    function setSearchState() {
      var empty = !query();
      if (emptyPanel) emptyPanel.hidden = !empty;
      if (choices) choices.hidden = empty;
      if (empty && notice) notice.textContent = "";
      if (retention) retention.hidden = !empty;
    }

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>"]/g, function (character) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character];
      });
    }

    function renderInlineMarkdown(value) {
      return escapeHtml(value)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|[^\s)]+)\)/g, function (_, label, href) {
          return "<a href=\"" + escapeHtml(href) + "\">" + label + "</a>";
        });
    }

    function renderMarkdown(value) {
      var lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
      var html = [];
      var paragraph = [];
      var listType = null;
      var codeBlock = [];
      var inCode = false;

      function flushParagraph() {
        if (!paragraph.length) return;
        html.push("<p>" + renderInlineMarkdown(paragraph.join(" ")) + "</p>");
        paragraph = [];
      }

      function closeList() {
        if (!listType) return;
        html.push("</" + listType + ">");
        listType = null;
      }

      function openList(type) {
        if (listType === type) return;
        closeList();
        html.push("<" + type + ">");
        listType = type;
      }

      lines.forEach(function (line) {
        var trimmed = line.trim();
        var unordered = trimmed.match(/^[-*]\s+(.+)/);
        var ordered = trimmed.match(/^\d+[.)]\s+(.+)/);

        if (trimmed.indexOf("```") === 0) {
          if (inCode) {
            html.push("<pre><code>" + escapeHtml(codeBlock.join("\n")) + "</code></pre>");
            codeBlock = [];
            inCode = false;
          } else {
            flushParagraph();
            closeList();
            inCode = true;
          }
          return;
        }

        if (inCode) {
          codeBlock.push(line);
          return;
        }

        if (!trimmed) {
          flushParagraph();
          closeList();
          return;
        }

        if (unordered || ordered) {
          flushParagraph();
          openList(unordered ? "ul" : "ol");
          html.push("<li>" + renderInlineMarkdown((unordered || ordered)[1]) + "</li>");
          return;
        }

        closeList();
        paragraph.push(trimmed);
      });

      if (inCode) html.push("<pre><code>" + escapeHtml(codeBlock.join("\n")) + "</code></pre>");
      flushParagraph();
      closeList();
      return html.join("");
    }

    function resetAnswer() {
      if (answer) answer.hidden = true;
      if (answerText) answerText.innerHTML = "";
      if (sources) sources.hidden = true;
      if (sourcesList) sourcesList.innerHTML = "";
      if (retention) retention.hidden = true;
      if (aiLoading) aiLoading.hidden = true;
      if (aiQueryRow) aiQueryRow.hidden = false;
      setDialogExpanded(false);
    }

    function openModal() {
      if (suppressNextFocus) { suppressNextFocus = false; return; }
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.documentElement.dataset.searchOpen = "true";
      modalInput.value = headerInput.value || "";
      setQueryText();
      resetAnswer();
      setSearchState();
      setTimeout(function () { modalInput.focus(); modalInput.select(); }, 0);
    }

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.documentElement.dataset.searchOpen = "false";
      headerInput.value = modalInput.value;
      syncHeaderQuery();
      suppressNextFocus = true;
      headerInput.focus();
    }

    function searchUrl() {
      var action = modalForm.getAttribute("action") || search.getAttribute("action") || "search.html";
      return new URL(action || window.location.pathname, window.location.href);
    }

    function runDocSearch() {
      var value = query();
      if (!value) { setSearchState(); return; }
      var url = searchUrl();
      url.searchParams.set("q", value);
      url.searchParams.set("check_keywords", "yes");
      url.searchParams.set("area", "default");
      window.location.href = url.toString();
    }

    function docsPrefix() {
      var match = window.location.pathname.match(/^(.*)\/(?:zh|en)(?:\/|$)/);
      return match ? match[1] : "";
    }

    function apiUrl() {
      if ((window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") && window.location.port && window.location.port !== "3000") {
        return window.location.protocol + "//" + window.location.hostname + ":3000/api/ai-qa/chat";
      }
      return (docsPrefix() || "") + "/api/ai-qa/chat";
    }

    function absDocsUrl(url) {
      var value = String(url || "#");
      if (!value || value === "#" || /^(https?:)?\/\//i.test(value)) return value;
      var prefix = docsPrefix();
      if (!prefix) return value;
      if (value === prefix || value.indexOf(prefix + "/") === 0) return value;
      return value.charAt(0) === "/" ? prefix + value : prefix + "/" + value;
    }

    var VECTOR_SIZE = 384;
    var staticIndexCache = {};

    function tokenize(value) {
      var tokens = [];
      var fragments = String(value || "").toLowerCase().match(/[a-z0-9_]+|[\u4e00-\u9fff]+/g) || [];
      fragments.forEach(function (fragment) {
        if (/^[\u4e00-\u9fff]+$/.test(fragment)) {
          var characters = Array.from(fragment);
          tokens.push.apply(tokens, characters);
          for (var index = 0; index < characters.length - 1; index += 1) {
            tokens.push(characters[index] + characters[index + 1]);
          }
        } else {
          tokens.push(fragment);
        }
      });
      return tokens;
    }

    function sha256Bytes(value) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then(function (buffer) {
        return new Uint8Array(buffer);
      });
    }

    function embeddingForText(value) {
      var vector = Array(VECTOR_SIZE).fill(0);
      var tokens = tokenize(value);
      return tokens.reduce(function (promise, token) {
        return promise.then(function () {
          return sha256Bytes(token).then(function (digest) {
            var index = ((digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3]) >>> 0;
            vector[index % VECTOR_SIZE] += 1;
          });
        });
      }, Promise.resolve()).then(function () {
        var norm = Math.sqrt(vector.reduce(function (sum, component) {
          return sum + component * component;
        }, 0)) || 1;
        return vector.map(function (component) { return component / norm; });
      });
    }

    function cosineSimilarity(left, right) {
      var score = 0;
      var length = Math.min(left.length, right.length);
      for (var index = 0; index < length; index += 1) score += left[index] * right[index];
      return score;
    }

    function lexicalBoost(question, chunk) {
      var queryTokens = Array.from(new Set(tokenize(question).filter(function (token) { return token.length > 1; })));
      var titleText = ((chunk.title || "") + " " + (chunk.section || "")).toLowerCase();
      var contentText = String(chunk.content || "").toLowerCase();
      var score = 0;
      queryTokens.forEach(function (token) {
        if (titleText.indexOf(token) !== -1) score += 0.12;
        if (contentText.indexOf(token) !== -1) score += 0.03;
      });
      return score;
    }

    function excerpt(value, maxLength) {
      var text = String(value || "").replace(/\s+/g, " ").trim();
      var limit = maxLength || 420;
      if (text.length <= limit) return text;
      var clipped = text.slice(0, limit);
      var breakIndex = Math.max(clipped.lastIndexOf("。"), clipped.lastIndexOf("."), clipped.lastIndexOf(" "), 180);
      return clipped.slice(0, breakIndex).trim() + "...";
    }

    function pickStaticAnswer(question, sources, language) {
      if (!sources.length) {
        return language === "en"
          ? "No matching content was found in the current documentation."
          : "未在当前文档中找到相关内容。";
      }
      var lead = language === "en"
        ? "Based on the current documentation, here are the most relevant notes for \"" + question + "\":"
        : "根据当前文档，关于“" + question + "”可以参考以下内容：";
      var snippets = sources.slice(0, 3).map(function (source) {
        var label = source.section && source.section !== source.title
          ? source.title + " / " + source.section
          : source.title;
        return "- " + label + ": " + excerpt(source.content);
      });
      return lead + "\n\n" + snippets.join("\n\n");
    }

    function loadStaticIndex(language) {
      if (staticIndexCache[language]) return staticIndexCache[language];
      var url = (docsPrefix() || "") + "/ai/index/chunks_" + language + ".json";
      staticIndexCache[language] = fetch(url).then(function (response) {
        if (!response.ok) throw new Error("missing index");
        return response.json();
      });
      return staticIndexCache[language];
    }

    function runStaticAi(question, language) {
      return loadStaticIndex(language).then(function (chunks) {
        return embeddingForText(question).then(function (queryEmbedding) {
          return chunks.map(function (chunk) {
            return Object.assign({}, chunk, {
              score: cosineSimilarity(queryEmbedding, chunk.embedding || []) + lexicalBoost(question, chunk)
            });
          }).sort(function (first, second) {
            return second.score - first.score;
          }).filter(function (chunk) {
            return chunk.score > 0;
          }).slice(0, 8).map(function (chunk) {
            return {
              title: chunk.title,
              section: chunk.section,
              url: absDocsUrl(chunk.docs_url),
              content: chunk.content,
              score: chunk.score
            };
          });
        });
      }).then(function (sources) {
        return { answer: pickStaticAnswer(question, sources, language), sources: sources };
      });
    }

    function renderSources(items) {
      if (!sources || !sourcesList) return;
      sourcesList.innerHTML = "";
      if (!items || !items.length) {
        sources.hidden = true;
        setNotice("no-sources");
        return false;
      }
      sources.hidden = false;
      var seenTitles = {};
      var renderedCount = 0;
      items.forEach(function (item) {
        if (renderedCount >= 5) return;
        var sourceTitle = String(item.title || item.url || item.docs_url || "").trim();
        var sourceKey = sourceTitle.toLowerCase();
        if (!sourceTitle || seenTitles[sourceKey]) return;
        seenTitles[sourceKey] = true;
        renderedCount += 1;
        var link = document.createElement("a");
        link.className = "ps-search-modal__source";
        link.href = item.url || item.docs_url || "#";
        var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "ps-search-modal__source-icon");
        icon.setAttribute("width", "16");
        icon.setAttribute("height", "16");
        icon.setAttribute("viewBox", "0 0 16 16");
        icon.setAttribute("aria-hidden", "true");
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "currentColor");
        path.setAttribute("d", "M3.75 1.5A1.75 1.75 0 0 0 2 3.25v9.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 12.75v-7.5a.75.75 0 0 0-.22-.53l-3-3a.75.75 0 0 0-.53-.22h-6.5Zm0 1.5h5.75v2.25c0 .69.56 1.25 1.25 1.25H12.5v6.25a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-9.5A.25.25 0 0 1 3.75 3Zm7.25.56L11.94 5H11V3.56ZM5 8.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 8.25Zm0 2.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 10.75Z");
        icon.appendChild(path);
        var body = document.createElement("span");
        body.className = "ps-search-modal__source-body";
        var title = document.createElement("span");
        title.className = "ps-search-modal__source-title";
        title.textContent = sourceTitle;
        body.appendChild(title);
        link.appendChild(icon);
        link.appendChild(body);
        sourcesList.appendChild(link);
      });
      if (!sourcesList.children.length) {
        sources.hidden = true;
        setNotice("no-sources");
        return false;
      }
      return true;
    }

    function showAiPayload(payload) {
      setDialogExpanded(true);
      if (aiLoading) aiLoading.hidden = true;
      if (answer) answer.hidden = false;
      if (answerText) answerText.innerHTML = renderMarkdown(payload.answer || "");
      if (aiQueryRow) aiQueryRow.hidden = true;
      if (renderSources(payload.sources || []) && notice) notice.textContent = "";
      if (retention) retention.hidden = false;
    }

    function showAiError() {
      if (aiLoading) aiLoading.hidden = true;
      if (answer) answer.hidden = true;
      if (aiQueryRow) aiQueryRow.hidden = false;
      if (retention) retention.hidden = true;
      setDialogExpanded(false);
      setNotice("error");
    }

    function runAiSearch() {
      var value = query();
      if (!value) { setSearchState(); return; }
      setDialogExpanded(false);
      if (aiQueryRow) aiQueryRow.hidden = true;
      if (aiLoading) aiLoading.hidden = false;
      if (answer) answer.hidden = true;
      if (answerText) answerText.innerHTML = "";
      if (sources) sources.hidden = true;
      if (retention) retention.hidden = true;
      setNotice("loading");
      var language = aiSearch.getAttribute("data-ps-language") || "zh";
      var controller = typeof AbortController === "function" ? new AbortController() : null;
      var timeoutId = controller ? window.setTimeout(function () { controller.abort(); }, 4000) : null;
      fetch(apiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: language,
          question: value,
          currentPath: window.location.pathname
        }),
        signal: controller ? controller.signal : undefined
      }).then(function (response) {
        if (!response.ok) throw new Error("AI search failed");
        return response.json();
      }).then(function (payload) {
        showAiPayload(payload);
      }).catch(function () {
        runStaticAi(value, language).then(showAiPayload).catch(showAiError);
      }).finally(function () {
        if (timeoutId) window.clearTimeout(timeoutId);
      });
    }

    search.addEventListener("submit", function (event) { event.preventDefault(); openModal(); });
    search.addEventListener("click", openModal);
    headerInput.addEventListener("focus", openModal);
    headerInput.addEventListener("click", openModal);
    modalInput.addEventListener("input", function () {
      setQueryText();
      resetAnswer();
      setSearchState();
      headerInput.value = modalInput.value;
      syncHeaderQuery();
    });
    exampleButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        modalInput.value = button.getAttribute("data-query") || button.textContent.trim();
        setQueryText();
        resetAnswer();
        setSearchState();
        headerInput.value = modalInput.value;
        syncHeaderQuery();
        runAiSearch();
      });
    });
    modalForm.addEventListener("submit", function (event) { event.preventDefault(); runDocSearch(); });
    docSearch.addEventListener("click", runDocSearch);
    aiSearch.addEventListener("click", runAiSearch);
    modal.querySelectorAll("[data-ps-search-close]").forEach(function (item) {
      item.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (event) {
      if (!modal.hidden && event.key === "Escape") closeModal();
    });
  }

  // ---- TOC scroll highlight -------------------------------------------
  function initTocHighlight() {
    var tocLinks = document.querySelectorAll(".ps-toc a[href^='#']");
    if (!tocLinks.length || !("IntersectionObserver" in window)) return;
    var byId = {};
    tocLinks.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute("href").slice(1));
      byId[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = byId[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          tocLinks.forEach(function (l) { l.removeAttribute("aria-current"); });
          a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "0px 0px -70% 0px", threshold: 0 });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // ---- Copy as Markdown (rudimentary innerText copy) ------------------
  function initCopyMd() {
    var btn = document.querySelector("[data-ps-copy-md-main]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var article = document.querySelector(".ps-article");
      if (!article) return;
      var text = article.innerText.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopiedToast);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        showCopiedToast();
      }
    });
  }
  function showCopiedToast() {
    var t = document.createElement("div");
    t.textContent = "Copied!";
    t.style.cssText = [
      "position:fixed", "left:50%", "bottom:32px",
      "transform:translateX(-50%)",
      "padding:8px 16px",
      "background:rgba(31,35,40,0.9)", "color:#fff",
      "border-radius:6px", "font-size:14px",
      "z-index:2000", "box-shadow:0 8px 24px rgba(0,0,0,0.2)"
    ].join(";");
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1800);
  }

  function init() {
    initBanner();
    initSidebarCollapse();
    initDrawer();
    initLanguageSwitcher();
    initSearchModal();
    initTocHighlight();
    initCopyMd();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
