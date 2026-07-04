export function canUseMedia(role: string): boolean {
    return role === "owner" || role === "editor";
}
