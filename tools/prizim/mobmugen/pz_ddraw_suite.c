#define COBJMACROS
#include <windows.h>
#include <ddraw.h>
#include <stdint.h>

#ifndef PZ_MODE
#define PZ_MODE 0
#endif

static LPDIRECTDRAW7 g_dd = NULL;
static LPDIRECTDRAWSURFACE7 g_primary = NULL;
static LPDIRECTDRAWSURFACE7 g_back = NULL;
static LPDIRECTDRAWSURFACE7 g_aux = NULL;

static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    if (msg == WM_DESTROY) {
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcA(hwnd, msg, wParam, lParam);
}

static void release_all(void) {
    if (g_aux) { IDirectDrawSurface7_Release(g_aux); g_aux = NULL; }
    if (g_back) { IDirectDrawSurface7_Release(g_back); g_back = NULL; }
    if (g_primary) { IDirectDrawSurface7_Release(g_primary); g_primary = NULL; }
    if (g_dd) { IDirectDraw7_Release(g_dd); g_dd = NULL; }
}

static HRESULT make_surface(DWORD w, DWORD h, LPDIRECTDRAWSURFACE7 *out) {
    DDSURFACEDESC2 d;
    ZeroMemory(&d, sizeof(d));
    d.dwSize = sizeof(d);
    d.dwFlags = DDSD_CAPS | DDSD_WIDTH | DDSD_HEIGHT;
    d.dwWidth = w;
    d.dwHeight = h;
    d.ddsCaps.dwCaps = DDSCAPS_OFFSCREENPLAIN;
    return IDirectDraw7_CreateSurface(g_dd, &d, out, NULL);
}

static int init_ddraw(HWND hwnd) {
    HRESULT hr;
    DDSURFACEDESC2 d;
    DDCOLORKEY key;

    hr = DirectDrawCreateEx(NULL, (void**)&g_dd, &IID_IDirectDraw7, NULL);
    if (FAILED(hr) || !g_dd) return 10;
    hr = IDirectDraw7_SetCooperativeLevel(g_dd, hwnd, DDSCL_NORMAL);
    if (FAILED(hr)) return 11;

    ZeroMemory(&d, sizeof(d));
    d.dwSize = sizeof(d);
    d.dwFlags = DDSD_CAPS;
    d.ddsCaps.dwCaps = DDSCAPS_PRIMARYSURFACE;
    hr = IDirectDraw7_CreateSurface(g_dd, &d, &g_primary, NULL);
    if (FAILED(hr) || !g_primary) return 12;

    hr = make_surface(320, 240, &g_back);
    if (FAILED(hr) || !g_back) return 13;

#if PZ_MODE == 2
    hr = make_surface(32, 32, &g_aux);
#elif PZ_MODE == 3
    hr = make_surface(160, 120, &g_aux);
#elif PZ_MODE == 4
    hr = make_surface(64, 64, &g_aux);
#else
    hr = DD_OK;
#endif
    if (FAILED(hr)) return 14;

#if PZ_MODE == 2
    key.dwColorSpaceLowValue = 0;
    key.dwColorSpaceHighValue = 0;
    IDirectDrawSurface7_SetColorKey(g_aux, DDCKEY_SRCBLT, &key);
#endif
    return 0;
}

static void restore_if_lost(void) {
    if (g_primary && IDirectDrawSurface7_IsLost(g_primary) == DDERR_SURFACELOST)
        IDirectDrawSurface7_Restore(g_primary);
    if (g_back && IDirectDrawSurface7_IsLost(g_back) == DDERR_SURFACELOST)
        IDirectDrawSurface7_Restore(g_back);
    if (g_aux && IDirectDrawSurface7_IsLost(g_aux) == DDERR_SURFACELOST)
        IDirectDrawSurface7_Restore(g_aux);
}

static void fill_surface(LPDIRECTDRAWSURFACE7 s, DWORD color) {
    DDBLTFX fx;
    ZeroMemory(&fx, sizeof(fx));
    fx.dwSize = sizeof(fx);
    fx.dwFillColor = color;
    if (IDirectDrawSurface7_Blt(s, NULL, NULL, NULL, DDBLT_COLORFILL | DDBLT_WAIT, &fx) == DDERR_SURFACELOST)
        restore_if_lost();
}

static void client_rect_screen(HWND hwnd, RECT *rc) {
    POINT a, b;
    GetClientRect(hwnd, rc);
    a.x = rc->left; a.y = rc->top;
    b.x = rc->right; b.y = rc->bottom;
    ClientToScreen(hwnd, &a);
    ClientToScreen(hwnd, &b);
    rc->left = a.x; rc->top = a.y; rc->right = b.x; rc->bottom = b.y;
}

static void write_locked_surface(LPDIRECTDRAWSURFACE7 s, unsigned frame) {
    DDSURFACEDESC2 d;
    HRESULT hr;
    int y;
    ZeroMemory(&d, sizeof(d));
    d.dwSize = sizeof(d);
    hr = IDirectDrawSurface7_Lock(s, NULL, &d, DDLOCK_WAIT | DDLOCK_SURFACEMEMORYPTR, NULL);
    if (FAILED(hr)) {
        if (hr == DDERR_SURFACELOST) restore_if_lost();
        return;
    }
    if (d.ddpfPixelFormat.dwRGBBitCount <= 16) {
        for (y = 0; y < (int)d.dwHeight; ++y) {
            uint16_t *p = (uint16_t*)((uint8_t*)d.lpSurface + y * d.lPitch);
            int x;
            for (x = 0; x < (int)d.dwWidth; ++x)
                p[x] = (uint16_t)(((x + frame) & 31) | (((y + frame) & 63) << 5) | (((x + y) & 31) << 11));
        }
    } else {
        for (y = 0; y < (int)d.dwHeight; ++y) {
            uint32_t *p = (uint32_t*)((uint8_t*)d.lpSurface + y * d.lPitch);
            int x;
            for (x = 0; x < (int)d.dwWidth; ++x)
                p[x] = ((x + frame) & 255) | (((y + frame) & 255) << 8) | (((x + y + frame) & 255) << 16);
        }
    }
    IDirectDrawSurface7_Unlock(s, NULL);
}

static void init_aux_pattern(void) {
#if PZ_MODE == 2
    DDSURFACEDESC2 d;
    int y;
    ZeroMemory(&d, sizeof(d)); d.dwSize = sizeof(d);
    if (SUCCEEDED(IDirectDrawSurface7_Lock(g_aux, NULL, &d, DDLOCK_WAIT | DDLOCK_SURFACEMEMORYPTR, NULL))) {
        for (y = 0; y < 32; ++y) {
            int x;
            if (d.ddpfPixelFormat.dwRGBBitCount <= 16) {
                uint16_t *p = (uint16_t*)((uint8_t*)d.lpSurface + y*d.lPitch);
                for (x = 0; x < 32; ++x) p[x] = (x < 3 || y < 3 || x > 28 || y > 28) ? 0 : 0x7e0;
            } else {
                uint32_t *p = (uint32_t*)((uint8_t*)d.lpSurface + y*d.lPitch);
                for (x = 0; x < 32; ++x) p[x] = (x < 3 || y < 3 || x > 28 || y > 28) ? 0 : 0x00ff00;
            }
        }
        IDirectDrawSurface7_Unlock(g_aux, NULL);
    }
#elif PZ_MODE == 3
    fill_surface(g_aux, 0x3def);
#elif PZ_MODE == 4
    fill_surface(g_aux, 0x5ad6);
#endif
}

static void draw_frame(HWND hwnd, unsigned frame) {
    RECT dst;
    restore_if_lost();

#if PZ_MODE == 0
    fill_surface(g_back, ((frame * 97u) ^ (frame << 5) ^ 0x1f3fu) & 0x00ffffffu);
#elif PZ_MODE == 1
    write_locked_surface(g_back, frame);
#elif PZ_MODE == 2
    {
        int i;
        fill_surface(g_back, 0);
        for (i = 0; i < 96; ++i) {
            RECT r;
            int x = (i * 37 + (int)frame * 3) % 288;
            int y = (i * 19 + (int)frame * 2) % 208;
            r.left = x; r.top = y; r.right = x + 32; r.bottom = y + 32;
            IDirectDrawSurface7_Blt(g_back, &r, g_aux, NULL, DDBLT_WAIT | DDBLT_KEYSRC, NULL);
        }
    }
#elif PZ_MODE == 3
    {
        RECT r = {0, 0, 320, 240};
        fill_surface(g_aux, ((frame * 211u) ^ 0x2a5au) & 0x00ffffffu);
        IDirectDrawSurface7_Blt(g_back, &r, g_aux, NULL, DDBLT_WAIT, NULL);
    }
#elif PZ_MODE == 4
    {
        int i;
        fill_surface(g_back, 0);
        for (i = 0; i < 160; ++i) {
            RECT r;
            int x = (i * 23 + (int)frame) % 256;
            int y = (i * 41 + (int)frame) % 176;
            r.left = x; r.top = y; r.right = x + 64; r.bottom = y + 64;
            IDirectDrawSurface7_Blt(g_back, &r, g_aux, NULL, DDBLT_WAIT, NULL);
        }
    }
#endif

    client_rect_screen(hwnd, &dst);
    if (IDirectDrawSurface7_Blt(g_primary, &dst, g_back, NULL, DDBLT_WAIT, NULL) == DDERR_SURFACELOST)
        restore_if_lost();
}

static const char* mode_name(void) {
#if PZ_MODE == 1
    return "LOCKWRITE";
#elif PZ_MODE == 2
    return "COLORKEY96";
#elif PZ_MODE == 3
    return "STRETCH2X";
#elif PZ_MODE == 4
    return "BLIT160";
#else
    return "BASELINE";
#endif
}

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE hPrev, LPSTR cmd, int show) {
    WNDCLASSA wc;
    HWND hwnd;
    RECT wr = {0, 0, 320, 240};
    MSG msg;
    DWORD next_frame, next_title;
    unsigned frame = 0;
    char title[160];
    int rc;

    ZeroMemory(&wc, sizeof(wc));
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInst;
    wc.lpszClassName = "PriZimDDrawSuite";
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    if (!RegisterClassA(&wc) && GetLastError() != ERROR_CLASS_ALREADY_EXISTS) return 2;

    AdjustWindowRect(&wr, WS_OVERLAPPEDWINDOW, FALSE);
    wsprintfA(title, "PriZim DD7 %s", mode_name());
    hwnd = CreateWindowA("PriZimDDrawSuite", title, WS_OVERLAPPEDWINDOW | WS_VISIBLE,
                         CW_USEDEFAULT, CW_USEDEFAULT, wr.right-wr.left, wr.bottom-wr.top,
                         NULL, NULL, hInst, NULL);
    if (!hwnd) return 3;
    ShowWindow(hwnd, SW_SHOW); UpdateWindow(hwnd);

    rc = init_ddraw(hwnd);
    if (rc) {
        wsprintfA(title, "PZ DDRAW INIT ERROR %d", rc);
        SetWindowTextA(hwnd, title);
        Sleep(3000); release_all(); return rc;
    }
    init_aux_pattern();

    next_frame = GetTickCount();
    next_title = next_frame + 1000;
    ZeroMemory(&msg, sizeof(msg));
    for (;;) {
        while (PeekMessageA(&msg, NULL, 0, 0, PM_REMOVE)) {
            if (msg.message == WM_QUIT) { release_all(); return 0; }
            TranslateMessage(&msg); DispatchMessageA(&msg);
        }
        {
            DWORD now = GetTickCount();
            if ((LONG)(now - next_frame) >= 0) {
                draw_frame(hwnd, frame++);
                next_frame += 16;
                if ((LONG)(now - next_frame) > 250) next_frame = now + 16;
            } else {
                Sleep(0);
            }
            if ((LONG)(now - next_title) >= 0) {
                wsprintfA(title, "PriZim DD7 %s | frames=%u", mode_name(), frame);
                SetWindowTextA(hwnd, title);
                next_title = now + 1000;
            }
        }
    }
}
