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
      const light = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(light);

      // Matrix風の文字セット
      const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?';

      // 文字の雨を生成
      const rainDrops: Array<{
        mesh: THREE.Sprite;
        velocity: number;
        resetY: number;
      }> = [];

      const createTextSprite = (char: string) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;

        canvas.width = 64;
        canvas.height = 64;

        // 背景を透明に
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Matrix風の緑色テキスト
        context.font = 'Bold 48px monospace';
        context.fillStyle = '#00ff00';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(char, 32, 32);

        // テクスチャとして使用
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
        });

        return new THREE.Sprite(material);
      };

      // 50-80文字をランダムに生成
      const numChars = Math.floor(Math.random() * 31) + 50; // 50-80

      for (let i = 0; i < numChars; i++) {
        const char = characters[Math.floor(Math.random() * characters.length)];
        const sprite = createTextSprite(char);

        if (sprite) {
          // ユーザーの周囲360度に配置
          const angle = Math.random() * Math.PI * 2; // 0-360度
          const radius = Math.random() * 2 + 1; // 1-3m
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = Math.random() * 3 + 2; // 2-5mの高さからスタート

          sprite.position.set(x, y, z);
          sprite.scale.set(0.3, 0.3, 1); // サイズ

          scene.add(sprite);

          rainDrops.push({
            mesh: sprite,
            velocity: Math.random() * 0.01 + 0.005, // 落下速度 0.005-0.015
            resetY: y + 5, // リセット時の高さ
          });
        }
      }

      console.log('WebXRセッションをリクエスト中...');

      // WebXR セッションの開始（hit-testをoptionalに変更）
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: [],
        optionalFeatures: ['hit-test', 'dom-overlay', 'local-floor'],
      });

      console.log('WebXRセッション作成成功');

      // Reference Spaceの取得（local-floorを優先、フォールバックでlocal）
      let referenceSpace: XRReferenceSpace;
      try {
        referenceSpace = await session.requestReferenceSpace('local-floor');
        console.log('local-floor参照空間を使用');
      } catch {
        referenceSpace = await session.requestReferenceSpace('local');
        console.log('local参照空間を使用（フォールバック）');
      }

      await renderer.xr.setSession(session);
      await renderer.xr.setReferenceSpace(referenceSpace);

      console.log('レンダラーにセッションを設定完了');

      setIsLoading(false);

      // アニメーションループ
      renderer.setAnimationLoop(() => {
        // 文字の雨アニメーション
        rainDrops.forEach((drop) => {
          // 下に移動
          drop.mesh.position.y -= drop.velocity;

          // 地面（y = 0）より下に落ちたらリセット
          if (drop.mesh.position.y < 0) {
            drop.mesh.position.y = drop.resetY;
            // 新しい文字に変更
            const newChar = characters[Math.floor(Math.random() * characters.length)];
            const newSprite = createTextSprite(newChar);
            if (newSprite) {
              drop.mesh.material = (newSprite as THREE.Sprite).material;
            }
          }

          // カメラの方向を向く（ビルボード効果）
          drop.mesh.lookAt(camera.position);
        });

        renderer.render(scene, camera);
      });

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
