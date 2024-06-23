"use strict";

import {helper} from "https://richadowonosas.github.io/scripts/helper.js";
import {getJsonData} from "https://richadowonosas.github.io/scripts/json.js";

let arts_showing = [];

// Functions

const setupRubyElement = (text) => {
    let result = '', reg = [[], []], tmp = '';
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
                break;
            case 1:
                switch (text[i]) {
                    case '{':
                        reg[0].push(tmp);
                        tmp = "";
                        result += `{${reg[0].join('-')}`;
                        break;
                    case '}':
                    case ']':
                        reg[0].push(tmp);
                        tmp = "";
                        result += `{${reg[0].join('-')}${text[i]}`;
                        status = 0;
                        reg[0] = [];
                        break;
                    case '[':
                        reg[0].push(tmp);
                        tmp = "";
                        status = 2;
                        break;
                    case '-':
                        reg[0].push(tmp);
                        tmp = "";
                        break;
                    case '\\':
                        i++;
                        if (i >= text.length) {
                            tmp += '\\';
                            break;
                        }
                        tmp += text[i];
                        break;
                    default:
                        tmp += text[i];
                        break;
                }
                break;
            case 2:
                switch (text[i]) {
                    case ']':
                        reg[1].push(tmp);
                        tmp = "";
                        status = 3;
                        break;
                    case '{':
                        reg[1].push(tmp);
                        tmp = "";
                        result += `{${reg[0].join('-')}[${reg[1].join('-')}`;
                        status = 1;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                    case '}':
                    case '[':
                        reg[1].push(tmp);
                        tmp = "";
                        result += `{${reg[0].join('-')}[${reg[1].join('-')}${text[i]}`;
                        status = 0;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                    case '-':
                        reg[1].push(tmp);
                        tmp = "";
                        break;
                    case '\\':
                        i++;
                        if (i >= text.length) {
                            tmp += '\\';
                            break;
                        }
                        tmp += text[i];
                        break;
                    default:
                        tmp += text[i];
                        break;
                }
                break;
            case 3:
                switch (text[i]) {
                    case '}':
                        let l0 = reg[0].length, l1 = reg[1].length;
                        if (l1 > l0)
                            reg[1][l0 - 1] = reg[1].slice(l0 - 1).join("");
                        for (let i = l1; i < l0; i++)
                            reg[1].push("");

                        result += "<ruby>";
                        for (let i = 0; i < l0; i++)
                            result += `${reg[0][i]}<rp>(</rp><rt>${reg[1][i]}</rt><rp>)</rp>`;
                        result += "</ruby>";
                        status = 0;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                    case '{':
                        result += `{${reg[0].join('-')}[${reg[1].join('-')}]`;
                        status = 1;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                    case ' ':
                        break;
                    default:
                        result += `{${reg[0].join('-')}[${reg[1].join('-')}]${text[i]}`;
                        status = 0;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                }
        }
    }

    // append unused contents
    switch (status) {
        default:
        case 0:
            break;
        case 1:
            reg[0].push(tmp);
            tmp = "";
            result += `{${reg[0].join('-')}`;
            break;
        case 2:
            reg[1].push(tmp);
            tmp = "";
            result += `{${reg[0].join('-')}[${reg[1].join('-')}`;
            break;
        case 3:
            result += `{${reg[0].join('-')}[${reg[1].join('-')}]`;
            break;
    }

    return result;
};

const fetchMarkdownData = (path) => {
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
        err => console.warn(err)
    );

    return prom;
};

const setupMarkdownData = (path, container) => {
    let prom = fetchMarkdownData(path);
    prom.then(
        raw_html => {
            container.innerHTML = raw_html;
        }
    ).catch(
        err => console.warn(err)
    );
};

const countWord = (text) => {
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
};

const countArticleWords = () => {
    for (let i = 0; i < content_arts.articles.length; i++) {
        let prom = fetchMarkdownData(content_arts.articles[i].article);
        prom.then(
            raw_html => {
                content_arts.articles[i].words = countWord(raw_html);
            }
        ).catch(
            err => console.warn(err)
        );
    }
};

const initButtons = () => {
    for (let i = 0; i < content_arts.articles.length; i++) {
        let b = document.createElement("button");
        b.value = content_arts.articles[i].id;
        b.innerText = content_arts.articles[i].name;
        b.onclick = () => helper.triggerEvent("page", {page: b.value});
        button_arts.push(b);
    }
};

const getExps = (str) => {
    let result = [];

    let conds = str.toLocaleLowerCase().split(' ');

    conds.forEach(
        (cond) =>
            cond === '' ?
                undefined :
                result.push(new RegExp(cond))
    );

    return result;
};

const initLocalSettings = () => {
    helper.setLocalID("reader");

    helper.addLocalConfigEntry("page", "-1", (listeners, ev) => {
        let page = helper.local.set("page", ev["page"] === undefined ? helper.local.get("page") : ev["page"]);
        // reload articles
        let content = content_arts.articles.find((c) => page === c.id);
        // fallback
        if (content === undefined) {
            content = content_arts.articles[0];
            page = content_arts.articles[0].id;
            helper.local.set("page", page);
        }

        helper.saveLocalConfig();

        setupMarkdownData(content.brief, art_brief);
        setupMarkdownData(content.article, art_main);
        // change button class
        button_arts.forEach(
            button => {
                button.classList.remove("selected");
                if (page === button.value) {
                    button.classList.add("selected");
                }
            }
        );

        for (let listenerID in listeners) {
            listeners[listenerID]({page: page});
        }
    });

    helper.addLocalConfigEntry("filter", "", (listeners, ev) => {
        let filter = helper.local.set("filter", ev["filter"] === undefined ? helper.local.get("filter") : ev["filter"]);
        helper.saveLocalConfig();
        // reset button container
        arts_showing = [];
        root_arts.innerHTML = "";

        // generate filter regex
        let conds = getExps(filter);

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

        for (let listenerID in listeners) {
            listeners[listenerID]({filter: filter});
        }
    });

    helper.loadLocalConfig();
};

const initArticles = () => {
    let prom = getJsonData('resources/index.json');

    prom.then(
        (json) => {
            content_arts.articles = json.articles;
            content_arts.articles = content_arts.articles.sort(
                (a1, a2) => a1.id.localeCompare(a2.id)
            );
            countArticleWords();
            initButtons();
            initLocalSettings();
        }
    ).catch((err) => console.warn(err));
};

const initLocale = () => {
    helper.importTranslation(document.URL.split("/").slice(0, -1).join("/") + "/resources/localized-strings.json");
    helper.addEventListener("locale", "title", (res) => document.title = res.str);
    helper.addEventListener("locale", "title_content", (res) => title_content.innerText = res.str);
    helper.addEventListener("locale", "filter_box", (res) => input_filter.placeholder = res.str);
};

const buildUpDrawer = () => {
    let warp = helper.drawer.createDrawerContentFrame("warp", "跳转");
    {
        let cont = warp.createContent("contents", "目录");
        cont.classList.add("button");

        let sp = document.createElement("span");
        sp.classList.add("icon_goto");
        cont.appendChild(sp);

        let a = document.createElement("a");
        a.href = "#root_page";
        a.appendChild(cont);

        warp.addContent(a);
    }
    {
        let cont = warp.createContent("brief", "简介");
        cont.classList.add("button");

        let sp = document.createElement("span");
        sp.classList.add("icon_goto");
        cont.appendChild(sp);

        let a = document.createElement("a");
        a.href = "#art_brief";
        a.appendChild(cont);

        warp.addContent(a);
    }
    {
        let cont = warp.createContent("main", "正文");
        cont.classList.add("button");

        let sp = document.createElement("span");
        sp.classList.add("icon_goto");
        cont.appendChild(sp);

        let a = document.createElement("a");
        a.href = "#art_main";
        a.appendChild(cont);

        warp.addContent(a);
    }
    helper.drawer.addDrawerContentByFrame(warp);
};

const initialise = () => {
    marked.setOptions({ mangle: false, headerIds: false });

    initLocale();
    buildUpDrawer();

    helper.loadGlobalConfig();
    helper.drawer.appendToDocument();

    initArticles();
};

// Initialisation
const art_brief = document.getElementById("art_brief");
const art_main = document.getElementById("art_main");
const root_arts = document.getElementById("root_arts");
const input_filter = document.getElementById("filter_box");
const title_content = document.getElementById("title_content");

const vacantDiv = document.createElement("div");

input_filter.oninput = () => helper.triggerEvent("filter", {filter: input_filter.value});
window.onresize = () => helper.drawer.updateDrawerCond();

const button_arts = [];
const content_arts = {};

document.body.onload = initialise;
