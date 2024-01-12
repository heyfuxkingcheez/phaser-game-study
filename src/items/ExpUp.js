import Phaser from 'phaser';

const ITEM_PROPERTY = {
    mob1: {
        exp: 10,
        color: 'red',
    },
    mob2: {
        exp: 20,
        color: 'blue',
    },
    mob3: {
        exp: 30,
        color: 'yello',
    },
    mob4: {
        exp: 40,
        color: 'green',
    },
};

export default class ExpUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, mob) {
        const x = mob.x;
        const y = mob.y;

        // 몹을 scene과 물리엔진에 추가해주는 부분
        super(scene, x, y, 'exp-up');
        scene.add.existing(this);
        scene.physics.world.enableBody(this);

        // 몹 종류에 따라 경험치 상승량, 이이템 이미지를 다르게 설정합니다.
        // mob.texture.key는 해당 몹 이미지를 LoadingScene에서 load했던 key와 동일하다.
        this.m_exp = ITEM_PROPERTY[mob.texture.key].exp;
        this.play(ITEM_PROPERTY[mob.texture.key].color);

        // 크기, depth, 물리 영역을 지정해준다.
        this.scale = 1.5;
        this.setDepth(7);
        this.setBodySize(20, 20);
    }
}
