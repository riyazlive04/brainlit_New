# The animation phase

The three models are in and the sequence plays. What is *not* done is the
animation: right now the only thing in the hero that actually moves under its
own power is the camera, the flight path, and the fire. The boy is a statue that
leans, and the aeroplane's propeller is welded solid.

This states what has to change, who has to do it, and how to tell when it is
right.

---

## The rule that governs all of it

**The sequence is a pure function of scroll position. Nothing plays; everything
is scrubbed.**

The visitor owns the playhead. They can stop halfway, scroll backwards, or land
mid-shot from a deep link. So every animated value must be derivable from
`scrollState.cinematic` alone — see `lib/shots.ts`. An animation clip is
therefore only ever a way to *sample a pose at a given time*:

```ts
mixer.setTime(clip.duration * throwProgress)   // yes
action.play()                                  // no
```

`BoyModel.tsx` already does this correctly. Anything added must too.

### The permitted exceptions

A handful of things legitimately use the clock, and there is a test for whether
a new one qualifies: **does this motion have a correct position?** A throw does
— at 40% through the shot the arm is somewhere specific. A propeller does not;
there is no "correct" blade angle for a given scroll offset. Existing exceptions,
all of them idle flourishes: the propeller, the boy's blink, the ember and
particle shaders' `uTime`.

If a proposed animation *does* have a correct position and you find yourself
reaching for the clock, that is the signal you have got it wrong.

---

## What needs to change

| # | Change | Owner | Blocks |
|---|---|---|---|
| 1 | Rig the boy, supply a throw clip | modeller | 2, 4, 5 |
| 2 | Fix the release hand-off | code | — |
| 3 | Restore the propeller | modeller + code | — |
| 4 | Give him presence in shot 1 | code | 1 |
| 5 | Make him watch the rocket | code | 1 |

### 1. Rig the boy, and supply a throw clip

Everything else about him waits on this. The current file is a single static
mesh — no skeleton, no clips — so `bodyLean` in `lib/throwPose.ts` tips his whole
body through the wind-up as a stopgap. It reads as a weight shift, not a throw.

Route: [Mixamo](https://www.mixamo.com), auto-rig, download with a throwing
animation. Bone naming (`mixamorig:RightArm`, `mixamorig:RightHand`) is already
what `lib/characterModel.ts` looks for, so a rigged export drops in with no code
change and both the arm swing and the held rocket start working.

**Tell whoever authors the clip that it will be scrubbed, not played.** It has to
read correctly as a still at *every* frame, and it must not depend on momentum or
overshoot that only works at one playback speed.

On arrival, delete `HAND_FALLBACK` and `bodyLean`.

### 2. Fix the release hand-off

There is a seam here today and it is worth understanding before it gets papered
over. The rocket rides `handRef` until `RELEASE_PROGRESS`, then switches to
`FLIGHT_CURVE`, which begins at the fixed world point `HAND_RELEASE` in
`lib/flightPath.ts`. Those two are about a metre apart, so the rocket jumps.

It predates the models — it was there with the procedural boy — but it becomes
much more visible with a real throw. Two parts:

- **Position.** Once rigged, read the hand's world position at the release frame
  and set `HAND_RELEASE` to it. The curve's other control points stay; only its
  first moves. One constant, same shape as every other fix in this codebase.
- **Timing.** `RELEASE_PROGRESS` currently fires at 0.45 through the throw shot,
  and on the fallback curve `armAngle(0.45) ≈ 0` — his arm is hanging straight
  down at the exact moment he is supposed to be letting go. Release belongs near
  the front of the swing, around 0.52–0.55, or wherever the supplied clip
  actually opens the hand.

### 3. Restore the propeller

A regression from swapping `CartoonPlane` for the GLB, and worth stating plainly
rather than discovering later. `PlaneBody` still passes `spinPropeller`, but it
only reaches the procedural aircraft. The loaded model is **one node and one
mesh** — the propeller is welded into the fuselage and cannot be turned.

Either: re-export the aeroplane with the propeller as a **separate named node**
(`propeller`, `prop`, `airscrew`), then spin that node on the clock, exactly as
`CartoonPlane` does. Or: accept a still propeller, which on an aircraft this
close to camera reads as a dead engine.

### 4. Give him presence in shot 1

The first 18% of the scroll is a boy standing perfectly still holding a rocket.
The procedural character had breathing and a blink for this and both are switched
off (`idle={false}` in `Boy.tsx`) because they were time-based.

With a rig, a breath is a clock exception on the same footing as the blink. The
cheaper option that needs no rig at all: drive a small breath from *scroll*, so
it stays positional and the rule holds without an exemption.

### 5. Make him watch the rocket

The highest payoff for the least work, and only available once he is rigged. The
rocket's position is a function of scroll, so aiming his head at it is fully
positional — no exception needed. He tracks it through the wind-up, follows it up
after release, and the shot-3 dolly to his eyeline then lands on a character who
was already looking where the camera is about to go.

Clamp the yaw and pitch so he never wrenches his neck past what a neck does.

---

## What not to do

- **Do not add a time-based loop to anything that has a correct position.** It
  will look right while you watch it forward and wrong the moment anyone scrolls
  back.
- **Do not animate through React state or props.** Per-frame values go through
  refs read inside `useFrame` — `throwRef` is the pattern. A prop changing sixty
  times a second re-renders the tree sixty times a second.
- **Do not let the procedural fallbacks rot.** `CartoonBoy`, the cone-and-fins
  rocket and `CartoonPlane` still play the part during the download, on a failed
  download, and on low-tier devices. Any change to the shape of the motion goes
  in `lib/throwPose.ts`, which both characters share, so the two cannot drift.

---

## How to tell when it is right

`/lab/cinematic` scrubs the whole sequence to any frame. For each item:

1. **Scrub backwards through the throw.** Every pose should be the mirror of the
   forward pass. Anything that only looks right going forwards is time-based.
2. **Stop on the release frame.** The rocket should be at his hand, not a metre
   from it, and his arm should be forward.
3. **`?p=0.05`, then `?p=0.30`.** He holds it, then he has thrown it, and the
   hand-off between the two is invisible.
4. **`?p=0.82`.** Propeller turning, aircraft upright, wings level.
5. **Reduced motion.** `prefers-reduced-motion` shows one settled frame; he is
   not in it. Nothing added here may start a loop that survives that.
