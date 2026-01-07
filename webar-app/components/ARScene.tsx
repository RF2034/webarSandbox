'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ARScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // WebXR AR対応チェック
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      navigator.xr
        ?.isSessionSupported('immersive-ar')
        .then((supported) => {
          setIsARSupported(supported);
        })
        .catch(() => {
          setIsARSupported(false);
          setError('WebXR APIの確認に失敗しました');
        });
    } else {
      setIsARSupported(false);
      setError('このブラウザはWebXRに対応していません');
    }
  }, []);

  const startAR = async () => {
    if (!containerRef.current || !navigator.xr) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('AR起動開始...');

      // Three.jsのセットアップ
      const scene = new THREE.Scene();

      // カメラ
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
      );

      // レンダラー
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;

      containerRef.current.appendChild(renderer.domElement);

      // ライト
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      light.position.set(0, 1, 0);
      scene.add(light);

      // 3Dオブジェクト（キューブ）
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        metalness: 0.5,
        roughness: 0.5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0, -1); // カメラから1m前方
      scene.add(cube);

      console.log('WebXRセッションをリクエスト中...');

      // WebXR セッションの開始（hit-testをoptionalに変更）
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: [],
        optionalFeatures: ['hit-test', 'dom-overlay'],
      });

      console.log('WebXRセッション作成成功');

      await renderer.xr.setSession(session);

      console.log('レンダラーにセッションを設定完了');

      setIsLoading(false);

      // アニメーションループ
      const animate = () => {
        renderer.setAnimationLoop(() => {
          // キューブを回転
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;

          renderer.render(scene, camera);
        });
      };

      animate();

      console.log('ARシーン起動完了');

      // セッション終了時のクリーンアップ
      session.addEventListener('end', () => {
        console.log('ARセッション終了');
        renderer.setAnimationLoop(null);
        setIsLoading(false);
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      });
    } catch (err) {
      console.error('AR起動エラー:', err);
      setIsLoading(false);
      setError(
        `AR起動に失敗しました: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* ARサポート確認中 */}
      {isARSupported === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <p className="text-white text-lg">ARサポートを確認中...</p>
        </div>
      )}

      {/* AR非対応 */}
      {isARSupported === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 p-4">
          <p className="text-white text-lg mb-4 text-center">
            このデバイスはWebXR ARに対応していません
          </p>
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <p className="text-gray-300 text-sm mt-4 text-center">
            ARに対応したAndroidまたはiOSデバイスでアクセスしてください
          </p>
        </div>
      )}

      {/* AR読み込み中 */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-white text-lg">ARを起動中...</p>
          <p className="text-gray-300 text-sm mt-2">
            カメラへのアクセスを許可してください
          </p>
        </div>
      )}

      {/* エラー表示 */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 p-4">
          <p className="text-red-400 text-lg mb-4 text-center">エラーが発生しました</p>
          <p className="text-white text-sm text-center mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-full"
          >
            閉じる
          </button>
        </div>
      )}

      {/* ARを開始ボタン */}
      {isARSupported === true && !isLoading && !error && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={startAR}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-colors"
          >
            ARを開始
          </button>
        </div>
      )}
    </div>
  );
}
