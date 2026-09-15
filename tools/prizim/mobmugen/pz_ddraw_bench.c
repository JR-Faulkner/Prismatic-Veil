#define COBJMACROS
#include <windows.h>
#include <ddraw.h>
#include <stdio.h>

static LPDIRECTDRAW7 g_dd = NULL;
static LPDIRECTDRAWSURFACE7 g_primary = NULL;
static LPDIRECTDRAWSURFACE7 g_back = NULL;

static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    if (msg == WM_DESTROY) {
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcA(hwnd, msg, wParam, lParam);
}

static void release_ddraw(void) {
    if (g_back) { IDirectDrawSurface7_Release(g_back); g_back = NULL; }
    if (g_primary) { IDirectDrawSurface7_Release(g_primary); g_primary = NULL; }
    if (g_dd) { IDirectDraw7_Release(g_dd); g_dd = NULL; }
}

static int init_ddraw(HWND hwnd) {
    HRESULT hr;
    DDSURFACEDESC2 desc;

    hr = DirectDrawCreateEx(NULL, (void**)&g_dd, &IID_IDirectDraw7, NULL);
    if (FAILED(hr) || !g_dd) return 10;

    hr = IDirectDraw7_SetCooperativeLevel(g_dd, hwnd, DDSCL_NORMAL);
    if (FAILED(hr)) return 11;

    ZeroMemory(&desc, sizeof(desc));
    desc.dwSize = sizeof(desc);
    desc.dwFlags = DDSD_CAPS;
    desc.ddsCaps.dwCaps = DDSCAPS_PRIMARYSURFACE;
    hr = IDirectDraw7_CreateSurface(g_dd, &desc, &g_primary, NULL);
    if (FAILED(hr) || !g_primary) return 12;

    ZeroMemory(&desc, sizeof(desc));
    desc.dwSize = sizeof(desc);
    desc.dwFlags = DDSD_CAPS | DDSD_WIDTH | DDSD_HEIGHT;
    desc.dwWidth = 320;
    desc.dwHeight = 240;
    desc.ddsCaps.dwCaps = DDSCAPS_OFFSCREENPLAIN;
    hr = IDirectDraw7_CreateSurface(g_dd, &desc, &g_back, NULL);
    if (FAILED(hr) || !g_back) return 13;

    return 0;
}

static void restore_if_lost(void) {
    if (g_primary && IDirectDrawSurface7_IsLost(g_primary) == DDERR_SURFACELOST)
        IDirectDrawSurface7_Restore(g_primary);
    if (g_back && IDirectDrawSurface7_IsLost(g_back) == DDERR_SURFACELOST)
        IDirectDrawSurface7_Restore(g_back);
}

static void draw_frame(HWND hwnd, unsigned frame) {
    DDBLTFX fx;
    RECT rc;
    POINT a, b;
    HRESULT hr;

    restore_if_lost();

    ZeroMemory(&fx, sizeof(fx));
    fx.dwSize = sizeof(fx);
    /* Deterministic changing color pattern. Raw fill values are intentional so
       this works across the 16/32-bpp modes used by the BoxedWine experiments. */
    fx.dwFillColor = ((frame * 97u) ^ (frame << 5) ^ 0x1f3fu) & 0x00ffffffu;
    hr = IDirectDrawSurface7_Blt(g_back, NULL, NULL, NULL,
                                 DDBLT_COLORFILL | DDBLT_WAIT, &fx);
    if (hr == DDERR_SURFACELOST) restore_if_lost();

    GetClientRect(hwnd, &rc);
    a.x = rc.left; a.y = rc.top;
    b.x = rc.right; b.y = rc.bottom;
    ClientToScreen(hwnd, &a);
    ClientToScreen(hwnd, &b);
    rc.left = a.x; rc.top = a.y;
    rc.right = b.x; rc.bottom = b.y;

    hr = IDirectDrawSurface7_Blt(g_primary, &rc, g_back, NULL, DDBLT_WAIT, NULL);
    if (hr == DDERR_SURFACELOST) restore_if_lost();
}

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE hPrev, LPSTR cmd, int show) {
    WNDCLASSA wc;
    HWND hwnd;
    RECT wr = {0, 0, 320, 240};
    MSG msg;
    DWORD next_frame;
    DWORD next_title;
    unsigned frame = 0;
    char title[128];
    int rc;

    ZeroMemory(&wc, sizeof(wc));
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInst;
    wc.lpszClassName = "PriZimDDrawBench";
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    if (!RegisterClassA(&wc) && GetLastError() != ERROR_CLASS_ALREADY_EXISTS)
        return 2;

    AdjustWindowRect(&wr, WS_OVERLAPPEDWINDOW, FALSE);
    hwnd = CreateWindowA("PriZimDDrawBench", "PriZim DirectDraw 60 FPS workload",
                         WS_OVERLAPPEDWINDOW | WS_VISIBLE,
                         CW_USEDEFAULT, CW_USEDEFAULT,
                         wr.right - wr.left, wr.bottom - wr.top,
                         NULL, NULL, hInst, NULL);
    if (!hwnd) return 3;

    ShowWindow(hwnd, SW_SHOW);
    UpdateWindow(hwnd);

    rc = init_ddraw(hwnd);
    if (rc) {
        wsprintfA(title, "PZ DDRAW INIT ERROR %d", rc);
        SetWindowTextA(hwnd, title);
        Sleep(3000);
        release_ddraw();
        return rc;
    }

    next_frame = GetTickCount();
    next_title = next_frame + 1000;
    ZeroMemory(&msg, sizeof(msg));

    for (;;) {
        while (PeekMessageA(&msg, NULL, 0, 0, PM_REMOVE)) {
            if (msg.message == WM_QUIT) {
                release_ddraw();
                return 0;
            }
            TranslateMessage(&msg);
            DispatchMessageA(&msg);
        }

        {
            DWORD now = GetTickCount();
            if ((LONG)(now - next_frame) >= 0) {
                draw_frame(hwnd, frame++);
                /* 16 ms pacing intentionally asks the runtime to sustain roughly
                   60 presents/sec without hiding a slow emulator behind RAF. */
                next_frame += 16;
                if ((LONG)(now - next_frame) > 250)
                    next_frame = now + 16;
            } else {
                Sleep(0);
            }

            if ((LONG)(now - next_title) >= 0) {
                wsprintfA(title, "PriZim DirectDraw workload | frames=%u", frame);
                SetWindowTextA(hwnd, title);
                next_title = now + 1000;
            }
        }
    }
}
