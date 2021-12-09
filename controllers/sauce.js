
const Sauce = require('../models/Sauce');

exports.getSauces = (req, res, next) => {

    /*
        response : Array of sauces

        Renvoie un tableau de
        toutes les sauces de la base
        de données.

    */

    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(404).json({ error }));

    console.log('Array of sauces');
};

exports.getOneSauce = (req, res, next) => {

    /*
        response : Single sauce

        Renvoie la sauce avec l’_id
        fourni.
    */
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

exports.addSauce = (req, res, next) => {

    /*
        response : { message: String } Verb

        Capture et enregistre l'image
        
        Analyse la sauce transformée en chaîne de caractères et l'enregistre
        dans la base de données en définissant correctement son imageUrl
        
        Initialise les likes et dislikes de la sauce à 0 et les
        usersLiked et usersDisliked avec des tableaux vides.
        
        Remarquez que le corps de la demande initiale est vide ;
        lorsque multer est ajouté, il renvoie une chaîne pour
        le corps de la demande en fonction des données soumises avec le fichier.
    */

    

        const sauceObject = JSON.parse(req.body.sauce);

        console.log(sauceObject)

        const sauce = new Sauce({
            ...sauceObject,
            likes: 0,
            dislikes: 0,
            usersLiked: [],
            usersDisliked: [],
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        });

        console.log(sauceObject)
    
        sauce.save()
            .then(() => res.status(201).json({ message: 'Sauce created' }))
            .catch(error => res.status(400).json({ error }));

};

exports.modifySauce = (req, res, next) => {

    /*
        response : { message: String }

        Met à jour la sauce avec l'_id fourni.

        Si une image est téléchargée, elle est capturée et l’imageUrl de la sauce est mise à jour.
        
        Si aucun fichier n'est fourni, les informations sur la sauce se trouvent directement
        dans le corps de la requête (req.body.name, req.body.heat, etc.).
        
        Si un fichier est fourni, la sauce transformée en chaîne de caractères se trouve
        dans req.body.sauce.
        
        Remarquez que le corps de la demande initiale est vide ;
        lorsque multer est ajouté, il renvoie une chaîne pour
        le corps de la demande en fonction des données soumises avec le fichier.
    */

    const sauceObject = req.file ?
    {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body};

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'CORPS DE LA REQUETTE' }))
        .catch(error => res.status(400).json({ error }));

    console.log('Sauce modified');
};

exports.deleteSauce = (req, res, next) => {

    /*
        response : { message: String }

        Supprime la sauce avec l'_id fourni.
    */
   Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
        if (!sauce) {
            return res.status(404).json({ error: new Error('Sauce not found') });
        }
        if (sauce.userId !== req.auth.userId) {
            return res.status(401).json({ error: new Error('Unauthorized reequest') });
        }
        Sauce.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce deleted' }))
        .catch(error => res.status(400).json({ error }));
    })
};

function removeUserInArray(array, user) {

    let i = 0;

    while (array[i] != user) {
        i++
    }
    array.splice(i, 1)
};

exports.likeSauce = (req, res, next) => {

    /*
        response : { message: String }
     
        Définit le statut « Like » pour l' userId fourni.

        Si like = 1, l'utilisateur aime (= like) la sauce.
        Si like = 0, l'utilisateur annule son like ou son dislike.
        Si like = -1, l'utilisateur n'aime pas (= dislike) la sauce.

        L'ID de l'utilisateur doit être ajouté ou retiré du tableau approprié.
        Cela permet de garder une trace de leurs préférences et les empêche de liker ou de disliker
        la même sauce plusieurs fois : un utilisateur ne peut avoir qu'une seule valeur pour chaque sauce.
        
        Le nombre total de « Like » et de « Dislike » est mis à jour à chaque nouvelle notation.
    */

    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {

            switch (req.body.like) {
                case 1 :
                    if (!sauce.usersLiked.includes(req.body.userId)) {      // If user is not already in usersLiked -> ok to like the sauce
                        sauce.likes += 1;
                        sauce.usersLiked.push(req.body.userId);
                        sauce.save();
                        res.status(200).json({ message: 'Sauce liked' });
                    } else {
                        res.status(400).json({ message: 'Sauce already liked' });
                    }
                    break;
                case -1 :
                    if (!sauce.usersDisliked.includes(req.body.userId)) {   // If user is not already in usersDisliked -> ok to dislike the sauce
                        sauce.dislikes += 1;
                        sauce.usersDisliked.push(req.body.userId);
                        sauce.save();
                        res.status(200).json({ message: 'Sauce disliked' });
                    } else {
                        res.status(400).json({ message: 'Sauce already disliked' });
                    }
                    break;
                    case 0 :
                        if (sauce.usersLiked.includes(req.body.userId)) {

                            console.log('user found in userLiked');

                            sauce.likes -= 1;
                            removeUserInArray(sauce.usersLiked, req.body.userId);
                            console.log('debug1');
                            sauce.save();
                            res.status(200).json({ message: 'Sauce unliked' });
                        } else if (sauce.usersDisliked.includes(req.body.userId)) {

                            console.log('user found in userDisliked');

                            sauce.dislikes -= 1;
                            removeUserInArray(sauce.usersDisliked, req.body.userId);
                            console.log('debug');
                            sauce.save();
                            res.status(200).json({ message: 'Sauce Undisliked' });
                        } else {
                            res.status(400).json({ message: 'error' });
                        }
                        break;
                default :
                    res.status(400).json({ message: 'error' });
            }
        }) 
        .catch(error => res.status(400).json({ error }));
};

