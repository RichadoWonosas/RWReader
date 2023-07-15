"use-strict";

// Functions

function setCookie(name, content, expire_time = 1e8) {
    document.cookie =
        name + '=' + content.toString() + '; ' +
        'max-age=' + expire_time.toString();
}

function getCookie(name) {
    let cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
        let contents = cookies[i].split('=', 2);
        if (contents[0] === name) {
            if (contents.length > 1) {
                return contents[1];
            } else {
                return '';
            }
        }
    }
}

function changeDrawerStatus(status) {
    drawer_expand = status;
    if (drawer_expand) {
        document.body.appendChild(mask_drawer);
        mask_drawer.onclick = () => changeDrawerStatus(false);
        div_drawer.classList.remove("collapse");
        div_drawer.classList.add("expand");
        button_drawer.classList.remove("collapse");
        button_drawer.classList.add("expand");
        setTimeout(() => {
            mask_drawer.classList.remove("collapse");
            mask_drawer.classList.add("expand");
        }, 0);
    } else {
        mask_drawer.onclick = () => { };
        div_drawer.classList.remove("expand");
        div_drawer.classList.add("collapse");
        button_drawer.classList.remove("expand");
        button_drawer.classList.add("collapse");
        mask_drawer.classList.remove("expand");
        mask_drawer.classList.add("collapse");
        setTimeout(() => {
            try {
                document.body.removeChild(mask_drawer)
            } catch (e) {
                console.log(e);
            };
        }, 333);
    }
}

function changeNightMode(status) {
    night_mode = status;

    if (status) {
        document.body.classList.add("night");
    } else {
        document.body.classList.remove("night");
    }

    setCookie("night", night_mode);
}

function checkNightMode() {
    let night = getCookie("night");
    switch (night) {
        default:
        case '':
        case 'true':
            night_mode = true;
            break;
        case 'false':
            night_mode = false;
            break;
    }
    button_daynight.checked = night_mode;

    setCookie("night", night_mode);

    changeNightMode(night_mode);
}

function checkFontSize() {
    let size = getCookie("size");
    switch (size) {
        default:
        case '':
        case 'medium':
            font_size = 'medium';
            break;
        case 'small':
            font_size = 'small';
            break;
        case 'large':
            font_size = 'large';
            break;
    }

    setCookie("size", font_size);
    changeFontSize(font_size);
}

function changeFontSize(size) {
    let opts = select_size.options;
    for (let i = 0; i < opts.length; i++) {
        opts[i].selected = false;
    }
    for (let i = 0; i < opts.length; i++) {
        if (opts[i].value === size) {
            opts[i].selected = true;
        }
    }

    art_brief.classList.remove(font_size);
    art_main.classList.remove(font_size);
    root_page.classList.remove(font_size);
    font_size = size;
    art_brief.classList.add(font_size);
    art_main.classList.add(font_size);
    root_page.classList.add(font_size);

    setCookie("size", font_size);
}

function getJsonData(path) {
    let prom = fetch(path).then(
        (response) =>
            response.status === 200 ?
                response.json() :
                {}
    );

    return prom;
}

function setupRubyElement(text) {
    let result = '', reg = ['', ''];
    let status = 0;

    if (typeof text !== 'string')
        return result;
    if (text.length === 0)
        return result;

    // run state machine
    for (let i = 0; i < text.length; i++) {
        switch (status) {
            default:
            case 0:
                if (text[i] !== '{') {
                    result += text[i];
                } else {
                    status = 1;
                }
                continue;
            case 1:
                switch (text[i]) {
                    case '{':
                        result += `{${reg[0]}`;
                        continue;
                    case '}':
                    case ']':
                        result += `{${reg[0]}${text[i]}`;
                        status = 0;
                        reg[0] = "";
                        continue;
                    case '[':
                        status = 2;
                        continue;
                    default:
                        reg[0] += text[i];
                        continue;
                }
            case 2:
                switch (text[i]) {
                    case ']':
                        status = 3;
                        continue;
                    case '{':
                        result += `{${reg[0]}[${reg[1]}`;
                        status = 1;
                        reg[0] = "";
                        reg[1] = "";
                        continue;
                    case '}':
                    case '[':
                        result += `{${reg[0]}[${reg[1]}${text[i]}`;
                        status = 0;
                        reg[0] = "";
                        reg[1] = "";
                        continue;
                    default:
                        reg[1] += text[i];
                        continue;
                }
            case 3:
                switch (text[i]) {
                    case '}':
                        result += `<ruby>${reg[0]}<rt>${reg[1]}</rt></ruby>`;
                        status = 0;
                        reg[0] = "";
                        reg[1] = "";
                        continue;
                    case '{':
                        result += `{${reg[0]}[${reg[1]}]`;
                        status = 1;
                        reg[0] = "";
                        reg[1] = "";
                        continue;
                    default:
                        result += `{${reg[0]}[${reg[1]}]${text[i]}`;
                        status = 0;
                        reg[0] = "";
                        reg[1] = "";
                    case ' ':
                        continue;
                }
        }
    }

    // append unused contents
    switch (status) {
        default:
        case 0:
            break;
        case 1:
            result += `{${reg[0]}`;
            break;
        case 2:
            result += `{${reg[0]}[${reg[1]}`;
            break;
        case 3:
            result += `{${reg[0]}[${reg[1]}]`;
            break;
    }

    return result;
}

function fetchMarkdownData(path) {
    let prom = fetch(path);
    prom = prom.then(
        response =>
            response.status === 200 ?
                response.text() :
                undefined
    ).then(
        content =>
            content === undefined ?
                marked.parse("# 无内容\n\n这里什么都没有……。\n") :
                marked.parse(content)
    ).then(
        raw_html => setupRubyElement(raw_html)
    ).catch(
        err => alert(err)
    );

    return prom;
}

function setupMarkdownData(path, container) {
    let prom = fetchMarkdownData(path);
    prom.then(
        raw_html => {
            container.innerHTML = raw_html;
        }
    ).catch(
        err => alert(err)
    );
}

function initialiseLanguage() {
    // Get language from cookie

    let lang = getCookie("lang");

    let prom = getJsonData('./resources/lang/langlist.json');

    prom.then(
        (data) => {
            languages.lang = data.languages;

            let chosen = languages.lang.findIndex(l => l.id === lang);
            if (chosen === -1) {
                chosen = 0;
            }
            language = languages.lang[chosen].id;

            for (let i = 0; i < languages.lang.length; i++) {
                let opt = document.createElement("option");
                opt.value = languages.lang[i].id;
                opt.innerHTML = languages.lang[i].name;
                if (i == chosen) {
                    opt.selected = true;
                }
                select_lang.appendChild(opt);
            }

            setCookie("lang", language);
            updateLanguage();
        }
    ).catch(
        (err) => {
            alert(err);
        }
    );

}

function updateLanguage() {
    let prom = getJsonData('./resources/lang/' + language + '.json');

    prom.then(
        (data) => {
            for (let i = 0; i < data.text.length; i++) {
                if (data.text[i].position !== "var") {
                    document.getElementById(data.text[i].id)[data.text[i].position] = data.text[i].value;
                } else {
                    var_lang[data.text[i].position] = data.text[i].value;
                }
            }
        }
    ).catch(
        (err) => {
            alert(err);
        }
    );
}

function changeLanguage(lang) {
    language = lang;
    setCookie("lang", language);
    updateLanguage();
}

function checkPages() {
    let id = getCookie("cur");
    selected_id =
        id === undefined ? "-1" : id;

    let search = getCookie("search");
    search_content =
        search === undefined ? "" : search;

    input_filter.value = search_content;

    setCookie("cur", selected_id);
    setCookie("search", search_content);
}

function countWord(text) {
    // get pure content
    vacantDiv.innerHTML = text;
    let t = vacantDiv.textContent;
    // count
    let result = 0;
    if (t === null) {
        return result;
    }
    let words = t.replaceAll('\n', ' ').split(/\b|\s+/).filter(s => ((s !== ' ') && (s !== '')));
    words.forEach(
        word => {
            let w = word.replaceAll(' ', '');
            if (/[0-9a-zA-Z]/.test(w[0])) {
                result += 1;
            } else {
                result += w.length;
            }
        }
    )
    return result;
}

function countArticleWords() {
    for (let i = 0; i < content_arts.articles.length; i++) {
        let prom = fetchMarkdownData(content_arts.articles[i].article);
        prom.then(
            raw_html => {
                content_arts.articles[i].words = countWord(raw_html);
            }
        ).catch(
            err => alert(err)
        )
    }
}

function renderWordCountZHCN(count) { }

function updatePage(id) {
    // setup cookie
    selected_id = id;
    setCookie("cur", selected_id);

    // reload articles
    let content = content_arts.articles.find(
        c => selected_id === c.id
    );
    // fallback
    if (content === undefined) {
        content = content_arts.articles[0];
        selected_id = content_arts.articles[0].id;
        setCookie("cur", selected_id);
    }
    setupMarkdownData(content.brief, art_brief);
    setupMarkdownData(content.article, art_main);

    // change button class
    button_arts.forEach(
        button => {
            button.classList.remove("selected");
            if (selected_id == button.value) {
                button.classList.add("selected");
            }
        }
    );
}

function updateFilter() {
    // reset button container
    arts_showing = [];
    root_arts.innerHTML = "";

    // generate filter regex
    search_content = input_filter.value;
    setCookie("search", search_content);
    let conds = getExps(search_content);

    // place filtered buttons back
    for (let i = 0; i < button_arts.length; i++) {
        let str = content_arts.articles[i].name + ' ' + content_arts.articles[i].tag;
        str = str.toLocaleLowerCase();
        let flag = true;
        for (let j = 0; j < conds.length; j++) {
            if (!conds[j].test(str)) {
                flag = false;
                break;
            }
        }
        if (flag) {
            root_arts.appendChild(button_arts[i]);
        }
    }
}

function initButtons() {
    for (let i = 0; i < content_arts.articles.length; i++) {
        let b = document.createElement("button");
        b.value = content_arts.articles[i].id;
        b.innerText = content_arts.articles[i].name;
        b.onclick = () => updatePage(b.value);
        button_arts.push(b);
    }
}

function getExps(str) {
    let result = [];

    let conds = str.toLocaleLowerCase().split(' ');

    conds.forEach(
        (cond) =>
            cond === '' ?
                undefined :
                result.push(new RegExp(cond))
    );

    return result;
}

function initArticles() {
    let prom = getJsonData('resources/index.json');

    prom.then(
        (json) => {
            content_arts.articles = json.articles;
            content_arts.articles = content_arts.articles.sort(
                (a1, a2) => a1.id.localeCompare(a2.id)
            );
            countArticleWords();
            checkPages();
            initButtons();
            updatePage(selected_id);
            updateFilter();
        }
    ).catch((err) => alert(err));
}

function markObjectSize(obj) {
    let i;
    for (i = 0; i < active_sheet.cssRules.length; i++) {
        if (active_sheet.cssRules[i].selectorText === "#" + obj.id) {
            active_sheet.deleteRule(i);
            i--;
        }
    }
    active_sheet.insertRule(
        "#" + obj.id + " {" +
        "--height: " + obj.offsetHeight + "px;" +
        "}"
    );
}

function updateDrawerCond() {
    let elements, i;
    elements = document.getElementsByClassName("drawer_container expand");
    for (i = 0; i < elements.length; i++) {
        markObjectSize(elements[i]);
    }
    elements = document.getElementsByClassName("drawer_container collapse");
    for (i = 0; i < elements.length; i++) {
        markObjectSize(elements[i]);
    }
}

function initialise() {
    marked.setOptions({ mangle: false, headerIds: false });
    initialiseLanguage();
    checkNightMode();
    checkFontSize();
    updateDrawerCond();
    changeDrawerStatus(false);
    initArticles();
}

// Initialisation
const div_drawer = document.getElementById("drawer");
const button_drawer = document.getElementById("drawer_button");
const mask_drawer = document.getElementById("drawer_mask");
const button_daynight = document.getElementById("daynight");
const select_lang = document.getElementById("select_language");
const select_size = document.getElementById("select_size");
const art_brief = document.getElementById("art_brief");
const art_main = document.getElementById("art_main");
const root_page = document.getElementById("root_page");
const root_arts = document.getElementById("root_arts");
const input_filter = document.getElementById("filter_box");

const opt_warp = document.getElementById("opt_warp");
const root_warp = document.getElementById("root_warp");
const warp_container = document.getElementById("warp_container");
const opt_settings = document.getElementById("opt_settings");
const root_settings = document.getElementById("root_settings");
const settings_container = document.getElementById("settings_container");

const vacantDiv = document.createElement("div");

const active_sheet = document.styleSheets[1];

button_drawer.onclick = () => changeDrawerStatus(!drawer_expand);
mask_drawer.onclick = () => changeDrawerStatus(false);
button_daynight.onchange = () => changeNightMode(button_daynight.checked);
select_lang.onchange = () => changeLanguage(select_lang.value);
select_size.onchange = () => changeFontSize(select_size.value);
input_filter.oninput = () => updateFilter();
window.onresize = () => updateDrawerCond();

opt_warp.onclick = () => {
    warp_expanded = !warp_expanded;
    root_warp.classList.remove(warp_expanded ? "collapse" : "expand");
    warp_container.classList.remove(warp_expanded ? "collapse" : "expand");
    root_warp.classList.add(!warp_expanded ? "collapse" : "expand");
    warp_container.classList.add(!warp_expanded ? "collapse" : "expand");
};
opt_settings.onclick = () => {
    settings_expanded = !settings_expanded;
    root_settings.classList.remove(settings_expanded ? "collapse" : "expand");
    settings_container.classList.remove(settings_expanded ? "collapse" : "expand");
    root_settings.classList.add(!settings_expanded ? "collapse" : "expand");
    settings_container.classList.add(!settings_expanded ? "collapse" : "expand");
};

var drawer_expand = false;
var night_mode;
var language;
var font_size;
var selected_id;
var search_content;
var arts_showing = [];
var warp_expanded = false;
var settings_expanded = false;

const ruby_exp = /\{([^\{\[\]\}]|\s)+\[([^\{\[\]\}]|\s)+\]\}/;
const languages = {};
const var_lang = {};
const button_arts = [];
const content_arts = {};

document.body.onload = initialise;
