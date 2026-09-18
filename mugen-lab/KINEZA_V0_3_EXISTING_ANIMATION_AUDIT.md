# Kineza v0.3 Existing Animation Audit

Generated from current validated v0.2. No art/gameplay files changed.

## Action 0

- Sprite frames: 1
- Unique sprite refs: 1
- Total nominal ticks: 0

| # | Sprite | Offset | Ticks | Flags |
|---:|---|---|---:|---|
| 0 | 9000,0 | 0,0 | -1 |  |

Raw AIR:

Clsn2Default: 1
  Clsn2[0] = -72,-320,72,0
9000,0, 0,0, -1

## Action 200

- Sprite frames: 3
- Unique sprite refs: 3
- Total nominal ticks: 11

| # | Sprite | Offset | Ticks | Flags |
|---:|---|---|---:|---|
| 0 | 1000,0 | 0,0 | 3 |  |
| 1 | 1002,0 | 0,0 | 3 |  |
| 2 | 1003,0 | 0,0 | 5 |  |

Raw AIR:

Clsn2Default: 1
  Clsn2[0] = -76,-315,76,0
1000,0, 0,0, 3
Clsn1: 1
  Clsn1[0] = 5,-280,235,-55
1002,0, 0,0, 3
1003,0, 0,0, 5

## Action 1000

- Sprite frames: 10
- Unique sprite refs: 10
- Total nominal ticks: 23

| # | Sprite | Offset | Ticks | Flags |
|---:|---|---|---:|---|
| 0 | 1000,0 | 0,0 | 5 |  |
| 1 | 1070,0 | 0,0 | 1 |  |
| 2 | 1070,1 | 0,0 | 1 |  |
| 3 | 1070,2 | 0,0 | 1 |  |
| 4 | 1070,3 | 0,0 | 1 |  |
| 5 | 1070,4 | 0,0 | 1 |  |
| 6 | 1070,5 | 0,0 | 1 |  |
| 7 | 1070,6 | 0,0 | 1 |  |
| 8 | 1002,0 | 0,0 | 4 |  |
| 9 | 1003,0 | 0,0 | 7 |  |

Raw AIR:

Clsn2Default: 1
  Clsn2[0] = -82,-310,82,0
1000,0, 0,0, 5
1070,0, 0,0, 1
1070,1, 0,0, 1
1070,2, 0,0, 1
1070,3, 0,0, 1
1070,4, 0,0, 1
1070,5, 0,0, 1
1070,6, 0,0, 1
Clsn1: 1
  Clsn1[0] = 0,-285,255,-45
1002,0, 0,0, 4
1003,0, 0,0, 7

## Action 1070

- Sprite frames: 18
- Unique sprite refs: 18
- Total nominal ticks: 39

| # | Sprite | Offset | Ticks | Flags |
|---:|---|---|---:|---|
| 0 | 1070,0 | 0,0 | 2 |  |
| 1 | 1070,1 | 0,0 | 2 |  |
| 2 | 1070,2 | 0,0 | 2 |  |
| 3 | 1070,3 | 0,0 | 2 |  |
| 4 | 1070,4 | 0,0 | 2 |  |
| 5 | 1070,5 | 0,0 | 2 |  |
| 6 | 1070,6 | 0,0 | 2 |  |
| 7 | 1070,7 | 0,0 | 2 |  |
| 8 | 1070,8 | 0,0 | 2 |  |
| 9 | 1070,9 | 0,0 | 2 |  |
| 10 | 1070,10 | 0,0 | 2 |  |
| 11 | 1070,11 | 0,0 | 2 |  |
| 12 | 1070,12 | 0,0 | 2 |  |
| 13 | 1070,13 | 0,0 | 2 |  |
| 14 | 1070,14 | 0,0 | 2 |  |
| 15 | 1070,15 | 0,0 | 2 |  |
| 16 | 1070,16 | 0,0 | 3 |  |
| 17 | 1070,17 | 0,0 | 4 |  |

Raw AIR:

Clsn2Default: 1
  Clsn2[0] = -88,-305,88,0
1070,0, 0,0, 2
1070,1, 0,0, 2
1070,2, 0,0, 2
1070,3, 0,0, 2
1070,4, 0,0, 2
1070,5, 0,0, 2
1070,6, 0,0, 2
Clsn1: 1
  Clsn1[0] = 0,-280,210,-35
1070,7, 0,0, 2
Clsn1: 1
  Clsn1[0] = 0,-280,225,-35
1070,8, 0,0, 2
Clsn1: 1
  Clsn1[0] = 0,-280,235,-35
1070,9, 0,0, 2
Clsn1: 1
  Clsn1[0] = 0,-280,225,-35
1070,10, 0,0, 2
Clsn1: 1
  Clsn1[0] = 0,-280,210,-35
1070,11, 0,0, 2
1070,12, 0,0, 2
1070,13, 0,0, 2
1070,14, 0,0, 2
1070,15, 0,0, 2
1070,16, 0,0, 3
1070,17, 0,0, 4

; Temporary common-state stand-ins. These keep the prototype loadable while
; dedicated hurt/fall/get-up art is produced.

## State summaries

### State 200

type = S
movetype = A
physics = S
juggle = 2
velset = 0,0
ctrl = 0
anim = 200
poweradd = 15
sprpriority = 2

[State 200, Hit]
type = HitDef
trigger1 = AnimElem = 2
attr = S,NA
damage = 35,4
animtype = Light
guardflag = MA
hitflag = MAF
priority = 3,Hit
pausetime = 7,7
sparkno = -1
guard.sparkno = -1
hitsound = F5,0
guardsound = F6,0
ground.type = High
ground.slidetime = 6
ground.hittime = 10
ground.velocity = -3.5,0
air.velocity = -2.5,-3

[State 200, Done]
type = ChangeState
trigger1 = AnimTime = 0
value = 0
ctrl = 1

; ---------------------------------------------------------------------------
; Momentum Fist -- first identity move.

### State 1000

type = S
movetype = A
physics = N
juggle = 6
velset = 0,0
ctrl = 0
anim = 1000
poweradd = 60
sprpriority = 3

[State 1000, Launch]
type = VelSet
trigger1 = AnimElem = 2
x = 7.8
y = 0

[State 1000, Carry]
type = VelMul
trigger1 = AnimElemTime(9) >= 0
x = .72

[State 1000, Hit]
type = HitDef
trigger1 = AnimElem = 9
attr = S,SA
damage = 85,14
animtype = Heavy
guardflag = MA
hitflag = MAF
priority = 5,Hit
pausetime = 10,12
sparkno = -1
guard.sparkno = -1
hitsound = F5,0
guardsound = F6,0
ground.type = High
ground.slidetime = 13
ground.hittime = 18
ground.velocity = -6.5,-2.5
air.velocity = -5,-4
fall = 1
fall.recover = 1

[State 1000, Done]
type = ChangeState
trigger1 = AnimTime = 0
value = 0
ctrl = 1

; ---------------------------------------------------------------------------
; Blitz Rush -- current 18-frame PriZim sequence used as one prototype move.

### State 1070

type = S
movetype = A
physics = N
juggle = 5
velset = 0,0
ctrl = 0
anim = 1070
poweradd = 45
sprpriority = 3

[State 1070, Burst]
type = VelSet
trigger1 = AnimElem = 2
x = 6.8
y = 0

[State 1070, Brake]
type = VelMul
trigger1 = AnimElemTime(13) >= 0
x = .78

[State 1070, Hit]
type = HitDef
trigger1 = AnimElem = 8
attr = S,SA
damage = 65,10
animtype = Medium
guardflag = MA
hitflag = MAF
priority = 4,Hit
pausetime = 8,9
sparkno = -1
guard.sparkno = -1
hitsound = F5,0
guardsound = F6,0
ground.type = High
ground.slidetime = 10
ground.hittime = 15
ground.velocity = -5,-1.5
air.velocity = -4,-3.5

[State 1070, Done]
type = ChangeState
trigger1 = AnimTime = 0
value = 0
ctrl = 1

## Generation gate findings

- Direct Punch currently has fewer than five unique body sprites. Use the supplied six-frame punch reference for the rebuild before requesting generation.
- Blitzer already has a deep source sequence. Retiming/axis/body-FX classification comes before any generation request.
