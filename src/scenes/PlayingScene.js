import Phaser from 'phaser';
import Config from '../Config';
import Player from '../characters/Player';
import Mob from '../characters/Mob';
import TopBar from '../ui/TopBar';
import ExpBar from '../ui/ExpBar';
import { setBackground } from '../utils/backgroundManager';
import { addMobEvent } from '../utils/mobManager';
import { addAttackEvent } from '../utils/attackManager';
import { pause } from '../utils/pauseManager';

export default class PlayingScene extends Phaser.Scene {
    constructor() {
        super('playGame');
    }

    create() {
        // 사용할 sound들을 추가해놓는 부분입니다.
        // load는 전역적으로 어떤 scene에서든 asset을 사용할 수 있도록 load 해주는 것이고,
        // add는 해당 scene에서 사용할 수 있도록 scene의 멤버 변수로 추가할 때 사용하는 것입니다.
        this.sound.pauseOnBlur = false;
        this.m_beamSound = this.sound.add('audio_beam');
        this.m_scratchSound = this.sound.add('audio_scratch');
        this.m_hitMobSound = this.sound.add('audio_hitMob');
        this.m_growlSound = this.sound.add('audio_growl');
        this.m_explosionSound = this.sound.add('audio_explosion');
        this.m_expUpSound = this.sound.add('audio_expUp');
        this.m_hurtSound = this.sound.add('audio_hurt');
        this.m_nextLevelSound = this.sound.add('audio_nextLevel');
        this.m_gameOverSound = this.sound.add('audio_gameOver');
        this.m_gameClearSound = this.sound.add('audio_gameClear');
        this.m_pauseInSound = this.sound.add('audio_pauseIn');
        this.m_pauseOutSound = this.sound.add('audio_pauseOut');

        // player를 m_player라는 멤버 변수로 추가합니다.
        this.m_player = new Player(this);

        this.cameras.main.startFollow(this.m_player);

        // PlayingScene의 background를 설정합니다.
        setBackground(this, 'background1');

        this.m_cursorKeys = this.input.keyboard.createCursorKeys();

        // Mob
        this.m_mobs = this.physics.add.group();
        this.m_mobs.add(new Mob(this, 0, 0, 'mob2', 'mob2_anim', 10));
        this.m_mobEvents = [];

        // scene, repeatGap, mobTexture, mobAnim, mobHp, mobDropRate
        addMobEvent(this, 1000, 'mob2', 'mob2_anim', 10, 0.3);

        // Attack
        this.m_weaponDynamic = this.add.group();
        this.m_weaponStatic = this.add.group();
        this.m_attackEvents = {};
        // scene, attackType, attackDamage, attackScale, repeatGap
        addAttackEvent(this, 'beam', 10, 1, 1000);

        // collisions
        /**
         * 어떤 오브젝트들이 충돌했을 때 동작을 발생시키려면 physics.add.overlap 함수를 사용합니다.
         * @param object1 오버랩되는지 검사할 오브젝트 1
         * @param object2 오버랩되는지 검사할 오브젝트 2
         * @param collideCallback 오브젝트 1과 오브젝트 2가 충돌하면 실행될 콜백함수입니다.
         * @param processCallback 두 오브젝트가 겹치는 경우 추가 검사를 수행할 수 있는 선택적 콜백 함수입니다. 이것이 설정되면 이 콜백이 true를 반환하는 경우에만 collideCallback이 호출됩니다.
         * @param callbackContext 콜백 스코프입니다. (this를 사용하시면 됩니다.)
         */

        // Player와 mob이 부딪혔을 경우 player에 데미지 10을 줍니다.
        // (Player.js에서 hitByMob 함수 확인)
        this.physics.add.overlap(
            this.m_player,
            this.m_mobs,
            () => this.m_player.hitByMob(10),
            null,
            this
        );

        // mob이 dynamic 공격에 부딪혓을 경우 mob에 해당 공격의 데미지만큼 데미지를 줍니다.
        // (Mob.js에서 hitByDynamic 함수 확인)
        this.physics.add.overlap(
            this.m_weaponDynamic,
            this.m_mobs,
            (weapon, mob) => {
                mob.hitByDynamic(weapon, weapon.m_damage);
            },
            null,
            this
        );

        // mob이 static 공격에 부딪혓을 경우 mob에 해당 공격의 데미지만큼 데미지를 줍니다.
        // (Mob.js에서 hitByStatic 함수 확인)
        this.physics.add.overlap(
            this.m_weaponStatic,
            this.m_mobs,
            (weapon, mob) => {
                mob.hitByStatic(weapon.m_damage);
            },
            null,
            this
        );

        // exp up item들을 담을 physics group을 추가해줍니다.
        this.m_expUps = this.physics.add.group();

        // player와 expUp이 접촉했을 떄 pickExpUp 메소드가 동작하도록 한다.
        this.physics.add.overlap(
            this.m_player,
            this.m_expUps,
            this.pickExpUp,
            null,
            this
        );

        // topBar, expBar를 PlayingScene에 추가
        // 맨 처음 maxExp는 50으로 설정,
        this.m_topBar = new TopBar(this);
        this.m_expBar = new ExpBar(this, 50);

        // event handler
        // ESC 키를 누르면 "pause" 유형으로 일시정지 한다
        this.input.keyboard.on('keydown-ESC', () => {
            pause(this, 'pause');
        });
        this;
    }

    update() {
        this.movePlayerManager();

        this.m_background.setX(this.m_player.x - Config.width / 2);
        this.m_background.setY(this.m_player.y - Config.height / 2);

        this.m_background.tilePositionX = this.m_player.x - Config.width / 2;
        this.m_background.tilePositionY = this.m_player.y - Config.width / 2;

        const closest = this.physics.closest(
            this.m_player,
            this.m_mobs.getChildren()
        );
        this.m_closest = closest;
    }

    movePlayerManager() {
        if (
            this.m_cursorKeys.left.isDown ||
            this.m_cursorKeys.right.isDown ||
            this.m_cursorKeys.up.isDown ||
            this.m_cursorKeys.down.isDown
        ) {
            if (!this.m_player.m_moving) {
                this.m_player.play('player_anim');
            }
            this.m_player.m_moving = true;
        } else {
            if (this.m_player.m_moving) {
                this.m_player.play('player_idle');
            }
            this.m_player.m_moving = false;
        }

        let vector = [0, 0];
        if (this.m_cursorKeys.left.isDown) {
            vector[0] += -1;
        } else if (this.m_cursorKeys.right.isDown) {
            vector[0] += 1;
        }

        if (this.m_cursorKeys.up.isDown) {
            vector[1] += -1;
        } else if (this.m_cursorKeys.down.isDown) {
            vector[1] += 1;
        }

        this.m_player.move(vector);
    }

    pickExpUp(player, expUp) {
        // expUp을 비활성화하고 화면에 보이지 않게 한다.
        expUp.disableBody(true, true);
        // expUp을 제거한다
        expUp.destroy();

        // 소리를 재생
        this.m_expUpSound.play();
        // 일단 콘솔로 상승한 경험치를 출력
        this.m_expBar.increase(expUp.m_exp);
        if (this.m_expBar.m_currentExp >= this.m_expBar.m_maxExp) {
            pause(this, 'levelup');
        }
    }

    afterLevelUp() {
        this.m_topBar.gainLevel();
    }
}
