// Mock data for the Instagram-style app
export type Story = {
  id: string;
  username: string;
  avatar: string;
  hasNewStory: boolean;
};

export type Post = {
  id: string;
  username: string;
  avatar: string;
  location?: string;
  image: string;
  likes: number;
  caption: string;
  comments: number;
  timestamp: string;
};

export type ChatItem = {
  id: string;
  username: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  online: boolean;
};

const av = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffd1dc,fff0f5,ffe4ec`;
const img = (id: number, w = 800, h = 1000) => `https://picsum.photos/seed/blush${id}/${w}/${h}`;

export const stories: Story[] = [
  { id: "you", username: "Your story", avatar: av("you"), hasNewStory: false },
  { id: "1", username: "lila.rose", avatar: av("lila"), hasNewStory: true },
  { id: "2", username: "mintymo", avatar: av("minty"), hasNewStory: true },
  { id: "3", username: "soft.kai", avatar: av("kai"), hasNewStory: true },
  { id: "4", username: "blushed", avatar: av("blush"), hasNewStory: true },
  { id: "5", username: "nuage", avatar: av("nuage"), hasNewStory: true },
  { id: "6", username: "petal", avatar: av("petal"), hasNewStory: true },
  { id: "7", username: "ari.m", avatar: av("ari"), hasNewStory: false },
];

export const posts: Post[] = [
  {
    id: "p1",
    username: "lila.rose",
    avatar: av("lila"),
    location: "Paris, France",
    image: img(1),
    likes: 2143,
    caption: "soft mornings and softer light ✨",
    comments: 42,
    timestamp: "2h",
  },
  {
    id: "p2",
    username: "soft.kai",
    avatar: av("kai"),
    location: "Tokyo",
    image: img(2),
    likes: 891,
    caption: "rooftop tea, slow thoughts 🍵",
    comments: 18,
    timestamp: "5h",
  },
  {
    id: "p3",
    username: "mintymo",
    avatar: av("minty"),
    image: img(3),
    likes: 5621,
    caption: "new prints in the studio today 🌸",
    comments: 132,
    timestamp: "1d",
  },
];

export const explore: string[] = Array.from({ length: 12 }, (_, i) => img(20 + i, 600, 600));

export const chats: ChatItem[] = [
  { id: "c1", username: "lila.rose", avatar: av("lila"), lastMessage: "omg yes let's go this weekend!", timestamp: "2m", unread: true, online: true },
  { id: "c2", username: "soft.kai", avatar: av("kai"), lastMessage: "sent the photos 📸", timestamp: "1h", unread: true, online: true },
  { id: "c3", username: "mintymo", avatar: av("minty"), lastMessage: "thank youuu 🌷", timestamp: "3h", unread: false, online: false },
  { id: "c4", username: "blushed", avatar: av("blush"), lastMessage: "you: see you tomorrow", timestamp: "1d", unread: false, online: true },
  { id: "c5", username: "nuage", avatar: av("nuage"), lastMessage: "Reacted ❤️ to your story", timestamp: "2d", unread: false, online: false },
  { id: "c6", username: "petal", avatar: av("petal"), lastMessage: "let me check and get back!", timestamp: "3d", unread: false, online: false },
];

export const profile = {
  username: "softie.studio",
  fullName: "Softie Studio",
  category: "Creator · Visual Design",
  website: "softie.studio",
  bio: "making pretty things ✿ paris / tokyo\nshop new drops below",
  avatar: av("softie"),
  posts: 248,
  followers: 18420,
  following: 312,
  grid: Array.from({ length: 9 }, (_, i) => img(40 + i, 600, 600)),
  tagged: Array.from({ length: 6 }, (_, i) => img(60 + i, 600, 600)),
};
