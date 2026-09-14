@ECHO OFF

pushd %~dp0

if "%SPHINXBUILD%" == "" set SPHINXBUILD=python -m sphinx
set SOURCEDIR=source
set BUILDDIR=build

if "%1" == "" goto help
if "%1" == "html" goto html
if "%1" == "gettext" goto gettext

%SPHINXBUILD% -M %1 %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%
goto end

:html
set DOCS_LANGUAGE=zh_CN
%SPHINXBUILD% -a -b html %SOURCEDIR% %BUILDDIR%\html\zh %SPHINXOPTS% %O%
if errorlevel 1 goto html_end
set DOCS_LANGUAGE=en
%SPHINXBUILD% -a -b html %SOURCEDIR% %BUILDDIR%\html\en %SPHINXOPTS% %O%
if errorlevel 1 goto html_end
python scripts\ai\build_index.py --html-dir %BUILDDIR%\html --output-dir %BUILDDIR%\ai\index --chroma-dir %BUILDDIR%\ai\chroma
if errorlevel 1 goto html_end
python scripts\ai\build_faq.py --index-dir %BUILDDIR%\ai\index --output-dir %BUILDDIR%\ai\index
if errorlevel 1 goto html_end
if not exist %BUILDDIR%\html\ai mkdir %BUILDDIR%\html\ai
copy /Y scripts\site\index.html %BUILDDIR%\html\index.html >nul
if exist %BUILDDIR%\html\ai\index rmdir /S /Q %BUILDDIR%\html\ai\index
xcopy /E /I /Y %BUILDDIR%\ai\index %BUILDDIR%\html\ai\index >nul
:html_end
set DOCS_LANGUAGE=
goto end

:gettext
%SPHINXBUILD% -b gettext %SOURCEDIR% %BUILDDIR%\gettext %SPHINXOPTS% %O%
if errorlevel 1 goto end
sphinx-intl update -p %BUILDDIR%\gettext -d %SOURCEDIR%\locale -l en
python scripts\i18n\apply_en.py
goto end

:help
%SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%

:end
popd
