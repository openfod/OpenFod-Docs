# Minimal makefile for Sphinx documentation.

SPHINXOPTS    ?=
SPHINXBUILD   ?= python -m sphinx
SOURCEDIR     = source
BUILDDIR      = build

.PHONY: help clean html html-zh html-en ai-index site-root gettext linkcheck

help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

clean:
	rm -rf "$(BUILDDIR)"

html:
	@$(MAKE) html-zh
	@$(MAKE) html-en
	@$(MAKE) ai-index
	@$(MAKE) site-root

html-zh:
	@DOCS_LANGUAGE=zh_CN $(SPHINXBUILD) -a -b html "$(SOURCEDIR)" "$(BUILDDIR)/html/zh" $(SPHINXOPTS) $(O)

html-en:
	@DOCS_LANGUAGE=en $(SPHINXBUILD) -a -b html "$(SOURCEDIR)" "$(BUILDDIR)/html/en" $(SPHINXOPTS) $(O)

ai-index:
	@python scripts/ai/build_index.py --html-dir "$(BUILDDIR)/html" --output-dir "$(BUILDDIR)/ai/index" --chroma-dir "$(BUILDDIR)/ai/chroma"
	@python scripts/ai/build_faq.py --index-dir "$(BUILDDIR)/ai/index" --output-dir "$(BUILDDIR)/ai/index"

site-root:
	@mkdir -p "$(BUILDDIR)/html/ai"
	@cp scripts/site/index.html "$(BUILDDIR)/html/index.html"
	@rm -rf "$(BUILDDIR)/html/ai/index"
	@cp -R "$(BUILDDIR)/ai/index" "$(BUILDDIR)/html/ai/index"

gettext:
	@$(SPHINXBUILD) -b gettext "$(SOURCEDIR)" "$(BUILDDIR)/gettext" $(SPHINXOPTS) $(O)
	@sphinx-intl update -p "$(BUILDDIR)/gettext" -d "$(SOURCEDIR)/locale" -l en
	@python scripts/i18n/apply_en.py

linkcheck:
	@$(SPHINXBUILD) -M linkcheck "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
