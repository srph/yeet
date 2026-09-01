// Side-effect import so Vidstack's base sheet rides with the lazy player
// chunks instead of the landing CSS. Both players share this module so Vite
// emits one CSS file, not two copies.
import "@vidstack/react/player/styles/base.css";
