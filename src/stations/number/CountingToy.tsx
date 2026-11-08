import { useEffect, useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Sprite } from '@/components/Sprite';
import type { CatalogId } from '@/data/catalog';
import { springs } from '@/theme';

/** Where a toy ends up: its bottom-center point in a wagon, and its scale there. */
export interface Seat {
  centerX: number;
  bottom: number;
  scale: number;
}

/** Screen rectangle that counts as "on the train" when a toy is dropped. */
export interface DropZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CountingToyProps {
  index: number;
  id: CatalogId;
  size: number;
  /** Top-left corner of the toy's starting spot. */
  homeX: number;
  homeY: number;
  /** Set once the toy is on the train. */
  seat: Seat | null;
  dropZone: DropZone;
  /** The train's driving offset, so seated toys ride along when it leaves. */
  trainX: SharedValue<number>;
  /** Asks the station to put this toy on the train (by drag-drop or tap). */
  onBoard: (index: number) => void;
}

/**
 * A toy the child drags onto the train (or simply taps, for little fingers
 * that find dragging hard). Dropped elsewhere, it springs back home.
 * Dragging runs entirely on the UI thread.
 */
export function CountingToy({ index, id, size, homeX, homeY, seat, dropZone, trainX, onBoard }: CountingToyProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const lift = useSharedValue(0); // 1 while held: a little bigger, on top
  const seated = useSharedValue(0);

  // Fly into the assigned wagon seat.
  useEffect(() => {
    if (!seat) return;
    tx.set(withSpring(seat.centerX - size / 2 - homeX, springs.gentle));
    ty.set(withSpring(seat.bottom - size - homeY, springs.gentle));
    scale.set(withSpring(seat.scale, springs.gentle));
    lift.set(withTiming(0, { duration: 150 }));
    seated.set(1);
  }, [seat, size, homeX, homeY, tx, ty, scale, lift, seated]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(!seat)
      .minDistance(6)
      .onStart(() => {
        'worklet';
        lift.set(withTiming(1, { duration: 120 }));
      })
      .onUpdate((e) => {
        'worklet';
        tx.set(e.translationX);
        ty.set(e.translationY);
      })
      .onEnd((e) => {
        'worklet';
        const inside =
          e.absoluteX >= dropZone.x &&
          e.absoluteX <= dropZone.x + dropZone.width &&
          e.absoluteY >= dropZone.y &&
          e.absoluteY <= dropZone.y + dropZone.height;
        if (inside) {
          scheduleOnRN(onBoard, index);
        } else {
          tx.set(withSpring(0, springs.bouncy));
          ty.set(withSpring(0, springs.bouncy));
          lift.set(withTiming(0, { duration: 150 }));
        }
      });
    const tap = Gesture.Tap()
      .enabled(!seat)
      .onEnd(() => {
        'worklet';
        scheduleOnRN(onBoard, index);
      });
    return Gesture.Race(pan, tap);
  }, [seat, dropZone, index, onBoard, tx, ty, lift]);

  // Outer layer: position, pop-in animation and stacking (the held toy is on top).
  const layerStyle = useAnimatedStyle(() => ({ zIndex: lift.value > 0 ? 100 : 10 }));
  // Inner layer: the movement (kept separate so the pop-in can't fight it).
  const moveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + seated.value * trainX.value },
      { translateY: ty.value },
      { scale: scale.value * (1 + lift.value * 0.12) },
    ],
  }));

  return (
    <Animated.View
      entering={ZoomIn.delay(index * 120).springify()}
      style={[{ position: 'absolute', left: homeX, top: homeY, width: size, height: size }, layerStyle]}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ width: size, height: size, transformOrigin: '50% 100%' }, moveStyle]}>
          <Sprite id={id} size={size} interactive={false} seed={index} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
