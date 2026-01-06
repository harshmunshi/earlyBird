import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGradient(id: string) {
  const gradients = [
    "from-blue-500 to-cyan-400",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-yellow-400",
    "from-green-500 to-emerald-400",
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
