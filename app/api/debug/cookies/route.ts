import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const cookies = request.cookies

    const authToken = cookies.get('auth-token')
    const userData = cookies.get('user-data')

    return NextResponse.json({
        cookies: {
            'auth-token': {
                exists: !!authToken,
                value: authToken?.value || null,
                raw: authToken || null
            },
            'user-data': {
                exists: !!userData,
                value: userData?.value || null,
                raw: userData || null,
                length: userData?.value?.length || 0
            }
        },
        allCookies: Object.fromEntries(
            cookies.getAll().map(cookie => [
                cookie.name,
                { value: cookie.value, length: cookie.value.length }
            ])
        )
    })
}
