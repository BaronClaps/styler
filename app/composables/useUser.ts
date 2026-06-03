// composables/useUser.ts
export const useUser = () => {
    const userId = useCookie<string | null>('user_id', {
        default: () => null,
        watch: true,
        maxAge: 60 * 60 * 24 * 365
    })

    return {
        userId
    }
}