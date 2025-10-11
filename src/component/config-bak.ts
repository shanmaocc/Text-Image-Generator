// 工作流配置数组
export const workflows = [
    // 工作流 0: 基础工作流
    {
        name: '基础工作流',
        description: '简单的文本到图像生成工作流',
        workflow: {
            '3': {
                class_type: 'KSampler',
                inputs: {
                    cfg: 7,
                    denoise: 1,
                    latent_image: ['5', 0],
                    model: ['4', 0],
                    negative: ['7', 0],
                    positive: ['6', 0],
                    sampler_name: 'euler',
                    scheduler: 'simple',
                    seed: 2196891713450562,
                    steps: 20,
                },
            },
            '4': {
                class_type: 'CheckpointLoaderSimple',
                inputs: {
                    ckpt_name: 'theDeepDark_v61Hybrid(动漫).safetensors',
                },
            },
            '5': {
                class_type: 'EmptyLatentImage',
                inputs: {
                    batch_size: 1,
                    height: 1024,
                    width: 1024,
                },
            },
            '6': {
                class_type: 'CLIPTextEncode',
                inputs: {
                    clip: ['4', 1],
                    text: '%prompt%',
                },
            },
            '7': {
                class_type: 'CLIPTextEncode',
                inputs: {
                    clip: ['4', 1],
                    text: '%negative_prompt%',
                },
            },
            '8': {
                class_type: 'VAEDecode',
                inputs: {
                    samples: ['3', 0],
                    vae: ['4', 2],
                },
            },
            '9': {
                class_type: 'SaveImage',
                inputs: {
                    filename_prefix: 'SillyTavern',
                    images: ['8', 0],
                },
            },
        }
    },
    // 工作流 1: 面部细化工作流
    {
        name: '面部细化工作流',
        description: '带有面部细化功能的高级工作流',
        workflow: {
            "4": {
                "inputs": {
                    "ckpt_name": "theDeepDark_v61Hybrid(动漫).safetensors"
                },
                "class_type": "CheckpointLoaderSimple",
                "_meta": {
                    "title": "Checkpoint加载器（简易）"
                }
            },
            "5": {
                "inputs": {
                    "width": 1024,
                    "height": 1024,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage",
                "_meta": {
                    "title": "空Latent图像"
                }
            },
            "6": {
                "inputs": {
                    "text": "(masterpiece:1.4), (best quality:1.3), (ultra detailed:1.3), (photorealistic:1.2),\n(soft natural light:1.3), (bright ambient light:1.3), (cinematic lighting:1.1), \n(soft shadows:1.2), (balanced exposure:1.2), (8k:1.1), (sharp focus:1.1),\n(beautiful woman:1.3), (1girl:1.2), (long hair:1.1), (dark hair:1.1), \n(clear skin:1.2), (subtle makeup:1.1), (smiling:1.1),\n(indoors:1.1), (bedroom:1.0), (soft background:1.2), (warm tones:1.2)\n",
                    "clip": [
                        "44",
                        0
                    ]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {
                    "title": "CLIP文本编码"
                }
            },
            "7": {
                "inputs": {
                    "text": "(low contrast), (underexposed), (dark shadows), (overexposed), \n(grainy), (blurry), (bad anatomy), (unnatural skin), (too dark), (harsh lighting)\n",
                    "clip": [
                        "44",
                        0
                    ]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {
                    "title": "CLIP文本编码"
                }
            },
            "25": {
                "inputs": {
                    "model_name": "4x_foolhardy_Remacri.pth"
                },
                "class_type": "UpscaleModelLoader",
                "_meta": {
                    "title": "加载放大模型"
                }
            },
            "29": {
                "inputs": {
                    "samples": [
                        "65",
                        0
                    ],
                    "vae": [
                        "4",
                        2
                    ]
                },
                "class_type": "VAEDecode",
                "_meta": {
                    "title": "VAE解码"
                }
            },
            "44": {
                "inputs": {
                    "stop_at_clip_layer": -2,
                    "clip": [
                        "4",
                        1
                    ]
                },
                "class_type": "CLIPSetLastLayer",
                "_meta": {
                    "title": "设置CLIP最后一层"
                }
            },
            "46": {
                "inputs": {
                    "lora_name": "Expressive_H-000001(heitai).safetensors",
                    "strength_model": 1,
                    "model": [
                        "4",
                        0
                    ]
                },
                "class_type": "LoraLoaderModelOnly",
                "_meta": {
                    "title": "LoRA加载器（仅模型）"
                }
            },
            "49": {
                "inputs": {
                    "model_name": "sam_vit_b_01ec64.pth",
                    "device_mode": "AUTO"
                },
                "class_type": "SAMLoader",
                "_meta": {
                    "title": "SAM加载器"
                }
            },
            "50": {
                "inputs": {
                    "guide_size": 512,
                    "guide_size_for": true,
                    "max_size": 1024,
                    "seed": 676460628668222,
                    "steps": 25,
                    "cfg": 12,
                    "sampler_name": "euler_ancestral",
                    "scheduler": "normal",
                    "denoise": 0.6,
                    "feather": 5,
                    "noise_mask": true,
                    "force_inpaint": true,
                    "bbox_threshold": 0.5,
                    "bbox_dilation": 20,
                    "bbox_crop_factor": 3,
                    "sam_detection_hint": "center-1",
                    "sam_dilation": 0,
                    "sam_threshold": 0.93,
                    "sam_bbox_expansion": 0,
                    "sam_mask_hint_threshold": 0.7,
                    "sam_mask_hint_use_negative": "False",
                    "drop_size": 10,
                    "wildcard": "",
                    "cycle": 1,
                    "inpaint_model": false,
                    "noise_mask_feather": 20,
                    "tiled_encode": {
                        "__value__": [
                            false,
                            true
                        ]
                    },
                    "tiled_decode": false,
                    "image": [
                        "29",
                        0
                    ],
                    "model": [
                        "46",
                        0
                    ],
                    "clip": [
                        "44",
                        0
                    ],
                    "vae": [
                        "4",
                        2
                    ],
                    "positive": [
                        "6",
                        0
                    ],
                    "negative": [
                        "7",
                        0
                    ],
                    "bbox_detector": [
                        "59",
                        0
                    ],
                    "sam_model_opt": [
                        "49",
                        0
                    ]
                },
                "class_type": "FaceDetailer",
                "_meta": {
                    "title": "面部细化"
                }
            },
            "59": {
                "inputs": {
                    "model_name": "bbox/face_yolov8m.pt"
                },
                "class_type": "UltralyticsDetectorProvider",
                "_meta": {
                    "title": "检测加载器"
                }
            },
            "65": {
                "inputs": {
                    "seed": 491004284200818,
                    "steps": 25,
                    "cfg": 12,
                    "sampler_name": "euler_ancestral",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": [
                        "46",
                        0
                    ],
                    "positive": [
                        "6",
                        0
                    ],
                    "negative": [
                        "7",
                        0
                    ],
                    "latent_image": [
                        "5",
                        0
                    ]
                },
                "class_type": "KSampler",
                "_meta": {
                    "title": "K采样器"
                }
            },
            "72": {
                "inputs": {
                    "filename_prefix": "ComfyUI",
                    "subdirectory_name": "",
                    "output_format": "png",
                    "quality": "max",
                    "metadata_scope": "full",
                    "include_batch_num": true,
                    "prefer_nearest": true,
                    "images": [
                        "50",
                        0
                    ]
                },
                "class_type": "SaveImageWithMetaData",
                "_meta": {
                    "title": "Save Image With MetaData"
                }
            }
        }
    }
];

// 默认使用的工作流索引
export const DEFAULT_WORKFLOW_INDEX = 1; // 默认使用面部细化工作流

// 兼容性导出（保持向后兼容）
export const face_detailer_workflow = workflows[1]?.workflow;


export let Presets = {
    tag_list: `<tag_list>
        \n## Tag List\ntag：Color\n\nblack thighhighs\nblue thighhighs\nbrown thighhighs\ngreen thighhighs\ngrey thighhighs\norange thighhighs\npink thighhighs\npurple thighhighs\nred thighhighs\nwhite thighhighs\nyellow thighhighs\nmulticolored_legwear thighhighs\nPattern\n\nargyle_legwear thighhighs\ncheckered_legwear thighhighs\nprint thighhighs\npolka_dot_legwear thighhighs\nstriped thighhighs\nvertical-striped thighhighs\nStyle\n\nlace-trimmed thighhighs\nlace-up thighhighs\nlatex thighhighs\nloose thighhigh\nribbon-trimmed thighhighs\nsingle thighhigh\nbow_legwear thighhighs\nfrilled thighhighs\nmismatched_legwear thighhighs\ntoeless_legwear thighhighs\ntorn thighhighs\nBands\n\nanimal_ear_legwear thighhighs\nbunny_ear_legwear thighhighs\ncat_ear_legwear thighhighs\nhorn_band_legwear thighhighs\nAction\n\npenis in thighhigh\nthighhigh dangle\nthighhighs pull\nvibrator in thighhighs\nadjusting_legwear thighhighs\nSee also\n\nsocks\nkneehighs\nover-kneehighs\nleggings\nthigh boots\nlegwear garter\nzettai ryouiki\nTag Group:Attire\n\ntag：Lingerie\n\nLingerie\nBabydoll\nBodystocking\nBra\nTag group:Bra\nBustier\nCamisole\nChemise\nCorset\nFishnets\ngarter straps\nGarter belt\nLace\nNightgown\nPanties\nBoyshort panties\nTag group:Panties\nStrapless bottom\nTeddy\nThighhighs\nThong\nG-string\nPearl thong\nMale Underwear\nBoxers\nBriefs\nBoxer briefs\nBikini briefs\nJockstrap\nBall bra\nPenis sheath\nBDSM\n\nBlindfold\nBodysuit\nGimp suit\nbondage outfit\nLatex\nMonoglove\nExposure\n\nCrotchless\ncrotchless panties\ncrotchless pants\ncrotchless swimsuit\ncrotchless pantyhose\ncrotchless leotard\ncrotchless bloomers\ncrotchless buruma\nAss Cutout\nassless swimsuit\nbackless panties\nbackless pants\nBreasts\nbreastless clothes\nnippleless clothes\ncupless bikini\ncupless bra\nrevealing clothes\nreverse outfit\nreverse bikini armor\nreverse bunnysuit\n\n\nBasic positions\n\nkneeling\non one knee\nlying\ncrossed legs\nfetal position\non back\non side\non stomach\nsitting\nbutterfly sitting\ncrossed legs\nfigure four sitting\nindian style\nhugging own legs\nlotus position\nseiza\nsitting on lap\nsitting on person\nstraddling\nthigh straddling\nupright straddle\nwariza\nyokozuwari\nstanding\nbalancing\ncrossed legs\nlegs apart\nstanding on one leg\nMovement of the body\n\nbalancing\ncrawling\nidle animation\njumping\nrunning\nwalking\nwalk cycle\nwallwalking\nOther postures potentially involving the whole body\n\nall fours\ntop-down bottom-up\nprostration\nchest stand\nchest stand handstand\ntriplefold\nruppelbend\nquadfold\ncowering\ncrucifixion\nfaceplant\nfighting stance\nbattoujutsu stance\nfull scorpion\nreclining\nsquatting\nstretching\nsuperhero landing\nupside-down\nhandstand\nheadstand\nyoga\nscorpion pose\nOther rest points of the body\n\narm support\nhead rest\nPosture of the head\n\nSee tag group:eyes tags for the direction of a character's gaze, including looking at viewer, looking to the side, looking afar, etc.\nhead down\nhead tilt\nTorso inclination\n\narched back Middle of spine pushed forwards\nbent back Middle of spine pushed backwards\nbent over\nleaning back\nleaning forward\nslouching\nsway back\ntwisted torso\nArms\n\nSee also Poses section.\n\nBasic arm position\n\narm behind back / arms behind back\narm up\narm behind head\n(see tag group:gestures for various gestures involving one arm up, including akanbe, salute, shushing, v over eye, waving, etc.)\nvictory pose\narms up\n\\o/\narms behind head\n(see tag group:gestures for various gestures involving two arms up, including carry me, heart hands, finger frame, horns pose, etc.)\noutstretched arm / outstretched arms\nspread arms\narm at side / arms at sides\nMore specific arm position\n\nairplane arms\ncrossed arms\nflexing\npraise the sun\nreaching\nshrugging\nt-pose\na-pose\nv arms\nw arms\nHand position\n\nstroking own chin\noutstretched hand\nsee tag group:hands for the location of the hand, and things touched by a hand. it includes hand on own ear, hand on own ass, hand in pocket, etc.)\nsee tag group:gestures for various gestures involving one or both hands.\nv\nHands touching each other (one or more characters)\n\ninterlocked fingers\nown hands clasped\nown hands together\nstar hands\nHips\n\ncontrapposto\nsway back\nLegs\n\nLeg location\n\ncrossed ankles\nfolded\nleg up\nlegs up\nknees to chest\nlegs over head\nleg lift\noutstretched leg\nsplit\npigeon pose\nstanding split\nspread legs\nwatson cross\nKnee location\n\nknees together feet apart\nknees apart feet together\nFoot position\n\ndorsiflexion\npigeon-toed\nplantar flexion\ntiptoes\ntiptoe kiss\nPosture of at least two characters\n\nass-to-ass\nback-to-back\nbelly-to-belly\ncheek-to-breast\ncheek-to-cheek\neye contact\nface-to-face\nforehead-to-forehead\nhead on chest\nheads together\nholding hands\nleg lock\nlocked arms\nover the knee\nnipple-to-nipple\nnoses touching\nshoulder-to-shoulder\ntail lock\nPosture of at least three characters\n\ncircle formation\ngroup hug\nHugging\n\nhug\nHugging doable by one or more characters\n\nhugging own legs\nhugging object\nhugging tail\nwing hug\nHugging doable by two or more characters\n\narm hug\nhug from behind\nwaist hug\nCarrying someone\n\nbaby carry\ncarrying\ncarried breast rest\ncarrying over shoulder\ncarrying under arm\nchild carry\nfireman's carry\npiggyback\nprincess carry\nshoulder carry\nsitting on shoulder\nstanding on shoulder\nPoses\n\nanimal pose\nrabbit pose\nhorns pose\npaw pose\nclaw pose\narcher pose\nbras d'honneur\nbody bridge\ncontrapposto\ndojikko pose\nghost pose\ninugami-ke no ichizoku pose — Upside-down with only legs visible\nletter pose\nojou-sama pose\nsaboten pose\nsymmetrical hand pose\nvictory pose\nvillain pose\nzombie pose\nSignature poses\n\nGendou pose — Fingers intertwined above the mouth\nJoJo pose\nDio Brando's pose — Menacing, mostly facing away, but glancing at the viewer\nGiorno Giovanna's pose — Legs apart, one arm doing a half-Superman exposure\nJonathan Joestar's pose — One hand in front of the face, one at the side facing back\nKujo Jotaro's pose — Pointing disdainfully\nKongou pose — Confident stance with an outstretched hand\nKujou Karen pose — Double finger guns with one arm bent\nSee Also\n\ntag groups\ntag group:gestures\ntag group:sexual positions\ntag group:meme -> dances/poses\ntag search pose\n\ntag：Head\n\near focus\ntag group:ears tags\ntag group:eyes tags\nface\ntag group:face tags\nforehead\nforehead mark\nhair\ntag group:hair\ntag group:hair color\ntag group:hair styles\nbeard\nmustache\nhead wings\nlips\nnape\ntongue\nlong tongue\nTorso\n\nUpper Torso\n\nareolae\nlarge areolae\nglands of montgomery\narmpits\nback\nbreasts\ntag group:breasts tags\ncollarbone\nheart\nlungs\nneck\nlong neck\nnipples\ncovered nipples\ninverted nipples\nno nipples\npuffy nipples\nsmall nipples\npectorals\nribs\nshoulders\ntag group:shoulders\nLower Torso\n\nanus\nass\ntag group:ass\ncloaca\ndimples of venus\ngroin\nhips\nwide hips\nintestines\nliver\nnarrow waist\npubic hair\npussy\ncleft of venus\nclitoris\nfat mons\nlabia\nmons pubis\ntag group:pussy\nno pussy\npenis\nanimal penis\ndog penis\ndolphin penis\nhorse penis\nknotted penis\npig penis\nsnake penis\nspiked penis\nbulge\ncovered penis\nerection under clothes\ndisembodied penis\nerection\nextra penises\nforeskin\nphimosis\nflaccid\ngigantic penis\nhuge penis\nlarge penis\nmultiple penises\nsmall penis\nveiny penis\nperineum\nprostate\npseudopenis\nstomach\nabs\nbelly\nnavel\ncovered navel\nobliques\nstomach_(organ)\ntesticles\ncovered testicles\nno testicles\nuterus\ncervix\nAppendages\n\narms\nthick arms\nbiceps\nfeet\nbad feet\nbarefoot\ndirty feet\nsoles\nhands\npalms\njoints\ndoll joints\nrobot joints\nknees\nkneepits\nlegs\nlong legs\nslim legs\ntail\ntag group:tail\ntentacles\nthighs\ngroin tendon\nthick thighs\ntoes\nninja toes\nwings\ntag group:wings\n\ntag：Partial nudity\n\nAny clothes\n\nclothing aside\nclothes down\nopen clothes\nrevealing clothes\nsee-through\nunbuttoned\nundressing\nunfastened\nuntied\nuntying\nunzipped\nunzipping\nMisc / Specific exposures that could fit multiple categories below\n\nbikini bottom aside\nbikini pull\ncape lift\nlifting covers\nbikini, open\nbra, open\nkimono, open\nrobe slip\nstrap lift\nstrap pull\nstrap slip\nswimsuit aside\none-piece swimsuit pull\ntowel, open\ntowel slip\nmale underwear pull\nExposed shoulders or arms\n\narmpits\narmpit cutout\nbare arms\narm cutout\nbare shoulders\noff shoulder\nshoulder cutout\nsleeves rolled up\nsleeveless\nlow-cut armhole\nsleeves pushed up\nsleeves rolled up\nExposed head or neck\n\nhood down\nExposed chest\n\ncenter opening\ncoat, open\nopen collar\ndress pull\nhoodie, open\njacket, open\nleotard pull\nkimono down\nkimono pull\npajamas pull\nopen robe\nshirt aside\ntopless male\nshirt, no\nshirt, open\nshirt lift\nshirt pull\nshirt slip\nsweater lift\ntop pull\nopen vest\nExposed breasts\n\nbreastless clothes\nbreast out, one\nbreast slip\nbreasts out\nbra lift\nbra, no\nbra pull\ntopless\nExposed parts of breasts\n\nbackboob\ncleavage\ncleavage cutout\nsideboob\nunderboob\nunderboob cutout\nExposed nipples\n\nareola slip\nnipple slip\nnippleless clothes\nnipples (visible)\nExposed torso\n\nback cutout\nbackless outfit\nbare back\nfrontless outfit\nmidriff\nnavel cutout\nside cutout\nsideless outfit\nstomach cutout\nwaist cutout\nFocus on exposed legs or feet\n\nbarefoot\nbare legs\ndress lift\nhip vent\nleg cutout\nthigh cutout\nside slit\npants, no\nshoe pull\nsock pull\nzettai ryouiki\nFocus on exposed ass or crotch\n\nass cutout\nbottomless\nburuma pull\nburuma aside\nclitoris slip\nclothing aside\ncrotch cutout\ndress aside\nleotard aside\nhakama pull\nkimono lift\nyukata lift\npanties, no\npanties aside\npants pull\nopen pants\npants pull\npanty lift\npanty pull\npussy peek\npantyhose pull\nshorts aside\nshorts, open\nshorts pull\nskirt around one leg\nskirt around ankles\nopen skirt\nskirt pull\nskirt lift\nswimsuit aside\nbikini bottom aside\nSpecific clothes or ornaments being worn as exceptions\n\nnaked apron\nnearly naked apron\nnaked bandage\nnaked cape\nnaked capelet\nnaked chocolate\nnaked cloak\nnaked coat\nnaked hoodie\nnaked jacket\nnaked overalls\nnaked ribbon\nnaked robe\nnaked scarf\nnaked sheet\nnaked shirt\nnaked suspenders\nnaked tabard\nnaked towel\nunderwear only\nNaughty points of view\n\ndownblouse\ndownpants\npantyshot\nupskirt\nDressing / Covering body parts\n\ncovering privates\ncovering anus\ncovering ass\ncovering breasts\ncovering crotch\ncovering head\ncovering own ears\ncovering one eye\ncovering own eyes\ncovering face\ncovering own mouth\nnude cover\nTouching clothes\n\nThese tags don't imply nudity, but are related to some other tags above.\n\nadjusting clothes\nclothes grab\napron grab\ncollar grab\nnecktie grab\nskirt grab\ncollar tug\ndress tug\nshirt tug\nskirt tug\nwringing clothes\nMisc / more\n\nnude modeling\ntan\ntanlines\n\ntag：\na flat chest is a status symbol\nbreast conscious\nbreast envy\nbreast awe\nflat envy\nbreast expansion\nbreast punch\nbreast reduction\nbreast padding\nbreast size switch\nbust chart\nbust measuring\nflying button\nlooking at breasts\nconvenient breasts\ninconvenient breasts\noversized breast cup\nslapping breasts\nslapping with breasts\nweighing breasts\nVisibility\n\nVisible parts of breasts\n\nareolae\nareola slip\ndark areolae\nglands of montgomery\nlarge areolae\nlight areolae\nbackboob\nbursting breasts\ncleavage\nnipples\ndark nipples\ncovered nipples\nhuge nipples\ninverted nipples\nlong nipples\nnipple slip\nno nipples\npuffy nipples\nsmall nipples\nnipple hair\nsideboob\nunderboob\nWhole breasts visible\n\nbreast slip\nbreastless clothes\nbreasts out\nimpossible shirt\none breast out\nDescriptions of breasts\n\nasymmetrical breasts\nbouncing breasts\nbreasts apart\nfloating breasts\nhanging breasts\nperky breasts\nsagging breasts\nunaligned breasts\nveiny breasts\npointy breasts\nClothes for breasts\n\nbandeau\nbikini\nbikini bottom only\ncupless bikini\nbra\ncupless bra\nhand in bra\nno bra\nnursing bra\nshelf bra\nbreastless clothes\nbreast curtain\nbustier\ncenter opening\nchest binder\nCinderella bust\ncleavage cutout\ncorset\nframed breasts\nnipple cutout\nnippleless clothes\npanties on breasts\nplunging neckline\nrei no himo\nsarashi\ntaut shirt\nunderbust\nBreasts and other parts of the body\n\nPenis on breasts\n\npaizuri (penis between breasts)\nautopaizuri\ncooperative paizuri\nhandsfree paizuri\npaizuri on lap\npaizuri over clothes\npaizuri under clothes\nperpendicular paizuri\nreverse paizuri\nstraddling paizuri\nnaizuri\ncooperative naizuri\npenis to breast\npenis under breasts\nnipple penetration\nHead on breasts\n\nbreast smother\nbreast pillow\nbreasts on head\nface to breasts\nface to pecs\nhead between breasts\nface between breasts\nMouth on breasts\n\nbreast biting\nbreastfeeding\nbreast sucking\nself breast sucking\nmutual breast sucking\nnursing handjob\nnipple biting\nlicking nipple\nHands on breasts\n\nbreast hold\ngrabbing another's breast\nflat chest grab\nguided breast grab\nbreast lift\nbreast poke\nbreast press\nbreast pull\nbreast punch\nslapping breasts\nbreasts squeezed together\nbreast suppress\ngroping\narm between breasts\nhand in bra\nnipple flick\nnipple press\nnipple push\nnipple pull\nnipple rub\nnipple tweak\nFeet on breasts\n\nfoot on breast\nToys on breasts\n\nnipple clamps\nnipple leash\nnipple piercing\nareola piercing\nnipple bar\nnipple bells\nnipple chain\nnipple lock\nnipple rings\nnipple stretcher\nnipple tag\nnipple plug\nnipple sleeves\nnipple torture\ntied nipples\nnipple ribbon\nvibrator on nipple\nDocking\n\nasymmetrical docking\nsymmetrical docking\nnipple-to-nipple\nMisc\n\nalternate breast size\nbetween breasts\ncard between breasts\narm between breasts\nhead between breasts\nnecktie between breasts\nperson between breasts\nbreast bondage\ntied breast\nbreast mousepad\nbreast implants\nbreast rest\ncarried breast rest\nslapping with breasts\nbreast crush\nbreasts on glass\nbust cup\ncovering breasts\ncum on breasts\nextra breasts\nfood on breasts\nchocolate on breasts\nlactation\nbreast milk\nbreast pump\nforced lactation\nlactating into container\nlactation through clothes\nmilking machine\nprojectile lactation\nmale with breasts\nmole on breast\nnipple injection\nobject on breast\nbubble tea challenge\nheadphones on breasts\nTawawa challenge\nobject on pectorals\noppai challenge\npool #4244 Powerful Breasts
    </tag_list>`,
    preceding_context: `<preceding_context>%preceding_context%</preceding_context>`,
    thinking_format:
        `<thinking_format>
        [You need to think carefully in English within <thinking> tags]
        - **Analyze character features**, determining if they are from a popular animation or manga; otherwise use terms like '1girl' to describe.
        - Confirm the theme or setting. Gather related keywords (such as style, colors, character features, environment, etc.). Extract the specific short-term state of the character (like mood, expressions, physical reactions, etc.).
        - Generate preliminary prompt words based on the extracted information. Ensure inclusion of key elements, and make tags explicit and unambiguous.
        - Verify whether the generated prompt words meet the expected format and requirements. Ensure clarity and coherence between elements, reflecting the current scene appropriately. Organize and optimize tags according to the review results, separate tags by commas without line breaks, ensure the linkage between tags, while including all critical information—around 150 words total.
    </thinking_format>`,
    content_format: `<content_format>
        #### 1. 主要场景设定 (Scene)
        指定主要场景的元素，明确场景的环境和氛围。
        - 关键场景元素使用加权标签 (element:weight)，以确保这些元素得到突出表现。
        - 普通重要的元素不做特殊加权。
        - 尽量避免不需要的场景元素，使用减权标签 [element]。
        #### 2. 角色设定 (Character)
        描述场景中的主要角色及其重要细节。
        - 角色大类使用加权标签 (role:weight)，确保角色的突出。
        - 角色特定细节使用适当加权 (detail:weight) 加强重要特征。
        - 可选角色特质用减权标签 [detail]，用以避免焦点转移。
        #### 3. 细节 (Details)
        补充场景中的额外细节，为整体增添真实感。
        - 重要的细节元素使用加权标签 (detail:weight)来提升细节的重要性。
        - 中等重要的细节不加权，保持默认权重。
        - 不太重要的或干扰的细节元素用减权 [detail]。
        #### 4. 颜色和氛围 (Colors and Atmosphere)
        定义图像的主色调和氛围，以确保一致的视觉风格。
        - 主要颜色和氛围使用加权标签 (color:weight)，突出某些关键色调。
        - 通常颜色元素不加权，保持默认设定。
        - 避免使用不协调的颜色，使用减权标签 [color]。
        #### 5. 画面元素优先级 (Element Priority)
        明确不同元素的重要性，以指导生成过程中元素的相对优先级。
        - 按重要性排序，并使用添加次序标签 ((priority))。
        ### 加权和减权操作
        1. **加权标签**:
        - 用圆括号 (element) 表示最基本的加权（权重乘1.1）。
        - 多层圆括号 ((element)) 表示更高的加权（例：两层表示权重乘1.21）。
        - 直接赋权 (element:weight) 提供具体权重值。
        2. **减权标签**:
        - 用方括号 [element] 表示最基本的减权（权重乘0.9）。
        - 多层方括号 [[element]] 表示更强的减权（例：两层表示权重乘0.81）。
    </content_format>`,
    inputs: `<inputs>
        请客观且全面地分析<preceding_context>文本，在<tag_list>中提炼出对应合适的SD提示词tag
        并使用<content_format>中的规则添加权重，强调主要角色为{{char}}，注意使用提升画面质感、光影、镜头等观感体验的tag，
        其次注意正在发生的事、穿着、外貌，其余权重均可降低，出现的角色用"1girl/1boy..."替代
        tag以组的形式出现，质量tag为一组{类型（肖像、插画）、视角（主视角、背后视角、从下至上，指的是画面的观察位通常是以{{user}}的视角为观察位）、画风、氛围、质量（极好、极高）、光影}，
        人物tag为一组(可以有多个人物组，但依旧以{{char}}为主){相貌（脸型、肤色），头发（颜色、发型），眼睛（颜色、瞳孔型状），身材（身高、胸部、屁股）、器官（pussy、penis、breasts等）}，
        穿着为一组{从上到下依次描述，头饰/发饰、面饰（眼镜、面具等）、耳饰、项链、内衣（胸罩、内裤）、套装（女仆装、西装、连衣裙等这种整套且上下身都有的，如果有了套装则忽略上下装）、上装、手饰（手套、手镯等）、下装、袜子（短袜、棉袜、过膝袜、长筒袜、吊带袜、连裤袜，外加颜色）、鞋子等}，
        角色动作tag为一组{表情、眼神、动作、姿势、性状态（高潮、潮吹、射精等）}，
        背景（1~2tag）、环境tag为一组{画面中出现的物品（水杯、笔、包包、武器、玩具、性玩具、液体、精液\淫水）、空间范围、背景}、
        是否是NSFW为一组{NSFW}
        遵循有则添加，没有则不写或者自行发挥原则，不要生成任何姓名（除非是知名动漫或游戏角色）、性格、情感以及负面提示的tag
        所有tag使用英文，每个tag都是独立的，不得换行,
        您的回复必须采用以逗号分隔的简洁关键字列表的格式(本次生成不要带权重)。
    </inputs>`,
}


