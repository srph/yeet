import { useEffect } from "react";
import { motion, useTransform, useMotionValue } from "framer-motion";

const encrypt = (input: string) => {
  return input
    .split("")
    .map((char) =>
      char === " "
        ? " "
        : String.fromCharCode(33 + Math.floor(Math.random() * 94))
    )
    .join("");
};

// speed = how long it takes for each loop to complete
// characters per loop = 1
const DecryptedText = ({
  text,
  speed = 100,
}: {
  text: string;
  speed?: number;
}) => {
  const cursor = useMotionValue(0);

  useEffect(() => {
    cursor.set(0);

    const interval = setInterval(() => {
      if (cursor.get() === text.length) return;
      cursor.set(cursor.get() + 1);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  const display = useTransform(cursor, (cursor) => {
    return text.slice(0, cursor) + encrypt(text.slice(cursor));
  });

  return <motion.span>{display}</motion.span>;
};

export { DecryptedText };
