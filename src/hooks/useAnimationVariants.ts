import { scale } from "framer-motion";

export const useAnimationVariants = () => ({
    slideIn: {
        initial: { opacity: 0, x: -4 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -4 },
    },
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 },
    },
    slideOnHover: {
        whileHover: { x: 2 },
        transition: { duration: 0.2 },
    },
    staggeredFadeIn: (index: number) => ({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: index * 0.03, duration: 0.2 },
    }),
});
