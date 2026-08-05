import { useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { getContent, type ContentLocale } from "./content";
import { HomeStage } from "./features/home/HomeStage";
import { useCharacterMusic } from "./hooks/useCharacterMusic";
import { usePersistentState } from "./hooks/usePersistentState";
import { useI18n } from "./i18n";
import type { Character } from "./types/content";
import "./App.css";

function App() {
  const { locale } = useI18n();
  const { characters, scripts } = useMemo(() => getContent(locale as ContentLocale), [locale]);
  const [theme, setTheme] = usePersistentState("castorice-theme", "dark", String);
  const [muted, setMuted] = usePersistentState("castorice-muted", false, (value) => value === "true");
  const [activeCharacterId, setActiveCharacterId] = useState(characters[0].id);
  const activeCharacter = characters.find((character) => character.id === activeCharacterId) ?? characters[0];

  const musicPlaying = useCharacterMusic(activeCharacter.music, muted);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const onPlay = (character: Character) => {
    if (character.id !== activeCharacterId) setActiveCharacterId(character.id);
  };

  return <div id="top" className="app-shell">
    <Header theme={theme} toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} muted={muted} musicPlaying={musicPlaying} toggleMuted={() => setMuted((value) => !value)} character={activeCharacter} />
    <Routes>
      <Route path="*" element={<HomeStage characters={characters} scripts={scripts} onPlay={onPlay} />} />
    </Routes>
  </div>;
}

export default App;
