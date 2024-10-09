import useAppContext from "@/hooks/useAppContext";
import useFileSystem from "@/hooks/useFileSystem";
import usePageEvents from "@/hooks/usePageEvents";
import useSetting from "@/hooks/useSetting";
import useSocket from "@/hooks/useSocket";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { editorThemes } from "@/resources/Themes";
import ACTIONS from "@/utils/actions";
import placeholder from "@/utils/editorPlaceholder";
import { color } from "@uiw/codemirror-extensions-color";
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { cursorTooltipBaseTheme, tooltipField } from "./tooltip";

function Editor() {
    const { users, currentUser } = useAppContext();
    const { currentFile, setCurrentFile } = useFileSystem();
    const { theme, language, fontSize } = useSetting();
    const { socket } = useSocket();
    const { tabHeight } = useWindowDimensions();
    const [timeOut, setTimeOut] = useState(null);
    
    // Filter out the current user from the users list
    const filteredUsers = users.filter(
        (u) => u.username !== currentUser.username
    );

    const onCodeChange = (code, view) => {
        const file = { ...currentFile, content: code };
        setCurrentFile(file);
        
        // Emit file updated event
        socket.emit(ACTIONS.FILE_UPDATED, { file });
        
        // Emit typing start event with cursor position
        const cursorPosition = view.state?.selection?.main?.head;
        socket.emit(ACTIONS.TYPING_START, { cursorPosition, username: currentUser.username });

        // Clear the previous timeout
        clearTimeout(timeOut);
        
        // Set a new timeout for typing pause
        const newTimeOut = setTimeout(
            () => socket.emit(ACTIONS.TYPING_PAUSE, { username: currentUser.username }),
            1000
        );
        
        setTimeOut(newTimeOut);
    };

    // Listen to wheel events to zoom in/out and prevent page reload
    usePageEvents();

    const getExtensions = useMemo(() => {
        const extensions = [
            color,
            hyperLink,
            tooltipField(users), // Pass all users to tooltipField
            cursorTooltipBaseTheme,
        ];

        // Load the appropriate language extension
        const langExt = loadLanguage(language.toLowerCase());
        if (langExt) {
            extensions.push(langExt);
        } else {
            toast.error("Syntax Highlighting not available for this language", {
                duration: 4000,
            });
        }

        return extensions;
    }, [language, currentFile?.name, users]);

    return (
        <CodeMirror
            placeholder={placeholder(currentFile.name)}
            theme={editorThemes[theme]}
            onChange={onCodeChange}
            value={currentFile.content}
            extensions={getExtensions}
            minHeight="100%"
            maxWidth="100vw"
            style={{
                fontSize: fontSize + "px",
                height: tabHeight,
                position: "relative",
            }}
        />
    );
}

export default Editor;
