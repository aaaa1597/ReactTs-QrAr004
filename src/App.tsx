import React, { useEffect, Suspense, useRef, useState, useMemo } from 'react';
import './App.css';
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls, useFBX } from '@react-three/drei'
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { useZxing } from "react-zxing";
import ResultPoint from '@zxing/library/esm/core/ResultPoint';

const FBXModel = (props:{setActionName: React.Dispatch<React.SetStateAction<string>>}) => {
  /* FBXモデル読込み */
  const fbx = useLoader(FBXLoader, "assets/Ch09_nonPBR.fbx");
  /* AnimationClip(s)読込み */
  const animCrips: THREE.AnimationClip[][] = []
  animCrips[0] = useFBX('./assets/BreakdanceEnding2.fbx').animations
  animCrips[1] = useFBX('./assets/BreakdanceUprockVar1.fbx').animations
  animCrips[2] = useFBX('./assets/HipHopDancing.fbx').animations
  animCrips[3] = useFBX('./assets/NorthernSoulSpin.fbx').animations
  animCrips[4] = useFBX('./assets/SwingDancing.fbx').animations
  animCrips[5] = useFBX('./assets/BreakdanceEnding1.fbx').animations
  const animNames = ['BreakdanceEnding2', 'BreakdanceUprockVar1', 'HipHopDancing', 'NorthernSoulSpin', 'SwingDancing', 'BreakdanceEnding1']
  /* 変数定義 */
  const mixer = useRef<THREE.AnimationMixer>();
  const [ animIdx, setAnimIdx ] = useState<number>(0);
  const animActions = useMemo(() => [] as THREE.AnimationAction[], [])

  /* 初期化 */
  useEffect(() => {
    fbx.scale.multiplyScalar(0.02)
    mixer.current = new THREE.AnimationMixer(fbx)
    animCrips.forEach((val: THREE.AnimationClip[], idx: number) => {
      if(!mixer.current) return;
      animActions[idx] = mixer.current.clipAction(val[0])
    })
    new Promise(() => setTimeout(() => {0}, 1000)).then(()=>animActions[0].play())
  }, [])

  /* モーション切替え処理 */
  useEffect(() => {
    const act: THREE.AnimationAction = animActions[animIdx]
    act?.reset().fadeIn(0.3).play()
    props.setActionName(animNames[animIdx] + ' : ' + animIdx)
    return () => {
      act?.fadeOut(0.3)
    }
  }, [animIdx])

  /* FPS処理 */
  useFrame((state, delta) => {
    if(mixer.current)
      mixer.current.update(delta);
    const durationtime: number= animActions[animIdx].getClip().duration
    const currenttime: number = animActions[animIdx].time
    if(currenttime/durationtime > 0.9/*90%を超えたら次のモーションへ*/) {
      const index: number = (animIdx+1) % (animCrips.length)
      setAnimIdx( index )
    }
  });

  return (
    <primitive object={fbx} position={[1, -1, 1]} />
  )
}

const ZxingQRCodeReader = (props:{setSize: React.Dispatch<React.SetStateAction<React.CSSProperties>>}) => {
  const { ref } = useZxing({
    constraints: {
      audio: false,
      video: {
        facingMode: 'environment',
        width: { min: 1024, ideal: 1920, max: 1920 },
        height: { min: 576, ideal: 1080, max: 1080 },
      },
    },
    onError(ret) {
      console.log('onError::ret=', ret);
    },
    onDecodeError(ret) {
      console.log('onDecodeError::ret=', ret);
    },
    onDecodeResult(result) {
      console.log('onDecodeResult::result=', result);
      if(result.getResultPoints().length <= 0) return;

//        setResult(result.getText());

      const points: ResultPoint[] = result.getResultPoints()
      console.log( 'ref.current?.offsetLeft=', ref.current?.offsetLeft)
      console.log(points.length, " -----[0]: ", points[0].getX(), " ,", points[0].getY(),)
      console.log(points.length, " -----[1]: ", points[1].getX(), " ,", points[1].getY(),)
      console.log(points.length, " -----[2]: ", points[2].getX(), " ,", points[2].getY(),)
      console.log(points.length, " -----[3]: ", points[3].getX(), " ,", points[3].getY(),)
    },
  });

  /* Videoサイズ変更に合わせてCanvasサイズを変更する */
  useEffect(() => {
    if(!ref.current) return;
    props.setSize({width: ref.current.videoWidth, height: ref.current.videoHeight});
  }, [ref.current?.videoWidth, ref.current?.videoHeight]);

  console.log("ref.current?.videoxxx=(", ref.current?.videoWidth, ",", ref.current?.videoHeight, ")" );
  
  return (
    <video ref={ref} />
  );
};

const App = () => {
  const [actionName, setActionName] = useState<string>('aaabbb');
  const [size, setSize] = useState<React.CSSProperties>({width: "300px", height: "200px"});
  return (
    <div>
      <ZxingQRCodeReader setSize={setSize}/>
      <Canvas camera={{ position: [3, 1, 3] }} style={{ position: "absolute", left: "0px",  top: "0px", width: `${size.width}px`,  height: `${size.height}px`,}}>
        <ambientLight intensity={2} />
        <pointLight position={[40, 40, 40]} />
        <Suspense fallback={null}>
          <FBXModel setActionName={setActionName}/>
        </Suspense>
        <OrbitControls />
        <axesHelper args={[5]} />
        <gridHelper />
      </Canvas>
      <div id="summry" style={{background: "rgba(255, 192, 192, 0.7)"}}>{actionName}</div>
    </div>
  );
}

export default App;
