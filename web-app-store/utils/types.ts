export interface App {
    app_id: number;
    app_name: string;
    icon: string;
    price: number;
    rating: number;
    downloads: number;
}

export interface AppDetails extends App {
    description: string;
    images: string[];
    last_update: string;
    tags: string[];
    comments: Comment[];
}

export interface Comment {
    comment_id: number;
    app_id: number;
    user_id: number;
    stars: number;
    comment: string;
    date: string;
    username: string;
}

export interface Category {
    tag_id: string;
    amount: number;
    similar_tag_ids: string; // JSON string
}
