import * as THREE from 'three'

export function createCharacter(accent: number): THREE.Group {
  const root = new THREE.Group()

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.45,
    metalness: 0.1,
  })
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65 })
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xf2c6a0, roughness: 0.75 })

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.02
  root.add(shadow)

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 7, 14), bodyMaterial)
  body.position.y = 1.08
  body.castShadow = true
  root.add(body)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), skinMaterial)
  head.position.y = 1.83
  head.castShadow = true
  root.add(head)

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), darkMaterial)
  hair.position.y = 1.95
  hair.castShadow = true
  root.add(hair)

  const armGeometry = new THREE.CapsuleGeometry(0.095, 0.47, 5, 10)
  const leftArm = new THREE.Mesh(armGeometry, bodyMaterial)
  leftArm.position.set(-0.43, 1.15, 0)
  leftArm.rotation.z = 0.14
  leftArm.castShadow = true
  root.add(leftArm)

  const rightArm = leftArm.clone()
  rightArm.position.x = 0.43
  rightArm.rotation.z = -0.14
  root.add(rightArm)

  const legGeometry = new THREE.CapsuleGeometry(0.11, 0.38, 5, 10)
  const leftLeg = new THREE.Mesh(legGeometry, darkMaterial)
  leftLeg.position.set(-0.18, 0.43, 0)
  leftLeg.castShadow = true
  root.add(leftLeg)

  const rightLeg = leftLeg.clone()
  rightLeg.position.x = 0.18
  root.add(rightLeg)

  root.userData.body = body
  root.userData.leftArm = leftArm
  root.userData.rightArm = rightArm
  root.userData.leftLeg = leftLeg
  root.userData.rightLeg = rightLeg
  root.userData.shadow = shadow

  return root
}

export function animateCharacterIdle(character: THREE.Group, time: number, active: boolean): void {
  const body = character.userData.body as THREE.Mesh
  const leftArm = character.userData.leftArm as THREE.Mesh
  const rightArm = character.userData.rightArm as THREE.Mesh

  const speed = active ? 3.3 : 2
  const amount = active ? 0.045 : 0.022
  body.position.y = 1.08 + Math.sin(time * speed) * amount
  leftArm.rotation.x = Math.sin(time * speed) * 0.08
  rightArm.rotation.x = -Math.sin(time * speed) * 0.08
}

export function animateJumpPose(character: THREE.Group, progress: number): void {
  const leftArm = character.userData.leftArm as THREE.Mesh
  const rightArm = character.userData.rightArm as THREE.Mesh
  const leftLeg = character.userData.leftLeg as THREE.Mesh
  const rightLeg = character.userData.rightLeg as THREE.Mesh
  const lift = Math.sin(progress * Math.PI)

  leftArm.rotation.x = -0.7 * lift
  rightArm.rotation.x = -0.7 * lift
  leftLeg.rotation.x = 0.45 * lift
  rightLeg.rotation.x = -0.45 * lift
}
