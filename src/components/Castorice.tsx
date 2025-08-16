import React, { useMemo } from "react";

const CastoSticker: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => {
    const fileName = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * 5) + 1;
    return `img/Sticker_Castorice_${String(randomIndex).padStart(2, "0")}.png`;
  }, []); // run only once

    return <img src={`/${fileName}`} alt="Sticker" {...props} />;
};

export default CastoSticker;
