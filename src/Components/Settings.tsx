import { AppContext, themesMain } from "../App";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement, useContext, useEffect, useRef, useState } from "react";
import useTheme from "../hooks/useTheme";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const Settings = (): ReactElement => {
    const {
        isSettingOpen,
        setSettingOpen,
        appSettings,
        setAppSettings,
        bookmarks,
        setBookmarks,
        theme,
        setTheme,
        promptSetDefaultLocation,
    } = useContext(AppContext);
    const settingContRef = useRef<HTMLDivElement>(null);
    const historyBtnRef = useRef<HTMLButtonElement>(null);
    const historyInputRef = useRef<HTMLInputElement>(null);
    const [mouseOnInput, setMouseOnInput] = useState(false);
    useEffect(() => {
        if (isSettingOpen) {
            setTimeout(() => {
                settingContRef.current?.focus();
            }, 300);
        }
    }, [isSettingOpen]);
    return (
        <div id="settings" data-state={isSettingOpen ? "open" : "closed"}>
            <div className="clickClose" onClick={() => setSettingOpen(false)}></div>
            <div
                className="cont"
                style={{ overflow: mouseOnInput ? "hidden" : "auto" }}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setSettingOpen(false);
                }}
                tabIndex={-1}
                ref={settingContRef}
            >
                <h1>
                    Settings
                    <button onClick={() => setSettingOpen(false)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </h1>
                <div className="content">
                    <div className="settingItem defaultLocation">
                        <div className="name">Default Location:</div>
                        <div className="current">
                            <input type="text" value={appSettings.baseDir} readOnly />
                            <button
                                // onFocus={(e) => e.currentTarget.blur()}
                                onClick={() => {
                                    promptSetDefaultLocation();
                                }}
                            >
                                Change Default
                            </button>
                        </div>
                    </div>
                    <div className="settingItem historyLimit">
                        <div className="name">History Limit:</div>
                        <div className="current">
                            <input
                                type="number"
                                defaultValue={appSettings.historyLimit}
                                ref={historyInputRef}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === "Enter") {
                                        historyBtnRef.current?.click();
                                    }
                                }}
                                onMouseEnter={() => setMouseOnInput(true)}
                                onMouseLeave={() => setMouseOnInput(false)}
                                readOnly={true}
                            />
                            <button
                                data-type="enable"
                                // onFocus={(e) => e.currentTarget.blur()}
                                ref={historyBtnRef}
                                onClick={(e) => {
                                    if (e.currentTarget.getAttribute("data-type") === "enable") {
                                        historyInputRef.current?.removeAttribute("readonly");
                                        historyInputRef.current?.focus();
                                        e.currentTarget.textContent = "Confirm";
                                        e.currentTarget.setAttribute("data-type", "set");
                                        e.currentTarget.classList.add("enabled");
                                    } else if (e.currentTarget.getAttribute("data-type") === "set") {
                                        setAppSettings((init) => {
                                            if (historyInputRef.current) {
                                                init.historyLimit = parseInt(historyInputRef.current.value);
                                            }
                                            return { ...init };
                                        });
                                        historyInputRef.current?.setAttribute("readonly", "true");
                                        e.currentTarget.textContent = "Change Default";
                                        e.currentTarget.setAttribute("data-type", "enable");
                                        e.currentTarget.classList.remove("enabled");
                                    }
                                }}
                            >
                                Change Default
                            </button>
                        </div>
                    </div>
                    <div className="settingItem exportBookmark">
                        <div className="name">Bookmarks:</div>
                        <div className="current">
                            <button
                                // onFocus={(e) => e.currentTarget.blur()}
                                onClick={(e) => {
                                    const opt = window.electron.dialog.showSaveDialogSync(
                                        window.electron.getCurrentWindow(),
                                        {
                                            title: "Export Bookmarks",
                                            defaultPath: "bookmarks.json",
                                            filters: [
                                                {
                                                    name: "json",
                                                    extensions: ["json"],
                                                },
                                            ],
                                        }
                                    );
                                    if (opt == undefined) return;
                                    window.fs.writeFileSync(opt, JSON.stringify(bookmarks) || JSON.stringify([]));
                                }}
                            >
                                Export
                            </button>
                            <button
                                // onFocus={(e) => e.currentTarget.blur()}
                                onClick={() => {
                                    const opt = window.electron.dialog.showOpenDialogSync(
                                        window.electron.getCurrentWindow(),
                                        {
                                            properties: ["openFile"],
                                            filters: [
                                                {
                                                    name: "Json",
                                                    extensions: ["json"],
                                                },
                                            ],
                                        }
                                    );
                                    if (opt == undefined) return;
                                    const data: ListItem[] = JSON.parse(window.fs.readFileSync(opt[0], "utf8"));
                                    const dataToAdd: ListItem[] = [];
                                    let similarFound = 0;
                                    data.forEach((item) => {
                                        if (("mangaName" && "link" && "chapterName") in item) {
                                            if (!bookmarks.map((e) => e.link).includes(item.link)) {
                                                dataToAdd.push(item);
                                            } else {
                                                similarFound++;
                                            }
                                        }
                                    });
                                    if (similarFound > 0)
                                        window.dialog.warn({
                                            title: "warning",
                                            message: "Found " + similarFound + " with same link",
                                        });
                                    setBookmarks([...bookmarks, ...dataToAdd]);
                                }}
                            >
                                Import
                            </button>
                            <button
                                // onFocus={(e) => e.currentTarget.blur()}
                                onClick={() => {
                                    const confirm1 = window.electron.dialog.showMessageBoxSync(
                                        window.electron.getCurrentWindow(),
                                        {
                                            type: "warning",
                                            title: "Delete BookMarks",
                                            message: "are you sure you want to remove bookmark?",
                                            buttons: ["yes", "no"],
                                        }
                                    );
                                    if (confirm1 == undefined) return;
                                    if (confirm1 === 1) return;
                                    if (confirm1 === 0) {
                                        const confirm2 = window.electron.dialog.showMessageBoxSync(
                                            window.electron.getCurrentWindow(),
                                            {
                                                type: "warning",
                                                title: "Delete BookMarks",
                                                message:
                                                    "are you really sure you want to remove bookmark?\nThis process is irreversible.",
                                                buttons: ["yes", "no"],
                                            }
                                        );
                                        if (confirm2 === 1) return;
                                    }
                                    setBookmarks([]);
                                }}
                            >
                                Delete All Bookmarks
                            </button>
                        </div>
                    </div>
                    <div className="settingItem themeSelector">
                        <div className="name">Theme:</div>
                        <div className="current">
                            <p>
                                Add custom theme by adding new item with changed css variable in <br />
                                <span className="copy">
                                    {window.path.join(window.electron.app.getPath("userData"), "themes.json")}
                                </span>
                            </p>
                            {themesMain.map((e) => (
                                <button
                                    className={theme === e.name ? "selected" : ""}
                                    onClick={() => setTheme(e.name)}
                                    key={e.name}
                                >
                                    {e.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="settingItem version">
                        <div className="name">Version:</div>
                        <div className="current">
                            <span>{window.electron.app.getVersion()}</span>
                        </div>
                    </div>
                    <div className="settingItem issue">
                        <div className="name">Issues? :</div>
                        <div className="current">
                            <button
                                // onFocus={(e) => e.currentTarget.blur()}
                                className="postIssue"
                                onClick={() =>
                                    window.electron.shell.openExternal(
                                        "https://github.com/mienaiyami/react-ts-offline-manga-reader/issues"
                                    )
                                }
                            >
                                <FontAwesomeIcon icon={faGithub} /> Submit Issue
                            </button>
                        </div>
                    </div>
                    {/* <div className="settingItem version">
                        <div className="name">Others:</div>
                        <div className="current">
                            <label>
                                <input type="checkbox" />
                                <p>Show Loading Screen</p>
                            </label>
                        </div>
                    </div> */}
                </div>
                <h1>Features</h1>
                <div className="features">
                    <ul>
                        <li>you can make custom theme by editing theme.json.</li>
                        <li>you dont need to type whole word in search.</li>
                        <li>
                            you can open next/prev chapter in "infinite scrolling" mode by clicking on right/left
                            part of screen when on scroll 0 or 100%.
                        </li>
                        <li>you can bring side list by moving mouse to left of screen.</li>
                        <li>you can pin and resize of side list.</li>
                        <li>you can shrink home page tabs by clicking dividers.</li>
                    </ul>
                </div>
                <h1>Shortcut Keys</h1>
                <div className="shortcutKey">
                    <table>
                        <tbody>
                            <tr>
                                <th>Key</th>
                                <th>Function</th>
                            </tr>
                            <tr>
                                <td> - , =, +, ctrl+scroll</td>
                                <td>size</td>
                            </tr>
                            <tr>
                                <td>q</td>
                                <td>reader settings</td>
                            </tr>
                            <tr>
                                <td>w, s, ???, ???</td>
                                <td>scroll</td>
                            </tr>
                            <tr>
                                <td>a, d, ???, ??? </td>
                                <td>prev/next page</td>
                            </tr>
                            <tr>
                                <td>space/shift+space</td>
                                <td>large scroll</td>
                            </tr>
                            <tr>
                                <td>h</td>
                                <td>Home</td>
                            </tr>
                            <tr>
                                <td>ctrl+r</td>
                                <td>Reload</td>
                            </tr>
                            <tr>
                                <td>f</td>
                                <td>search page number</td>
                            </tr>
                            <tr>
                                <td>[ and ]</td>
                                <td>prev/next</td>
                            </tr>
                            <tr>
                                <td>ctrl+n</td>
                                <td>New Window</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Settings;
