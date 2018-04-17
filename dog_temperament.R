library(data.table)
library(ggplot2)
library(viridis)
library(ggridges)
library(tidyr)
library(Hmisc)

setwd(dirname(rstudioapi::getActiveDocumentContext()$path))

dogs <- data.table(read.csv("dog_temperament.csv", header=FALSE))
colnames(dogs) <-  c("dog", "total", "pass", "fail")
dogs[, lower.conf := binconf(pass, total, alpha=0.2)[, 'Lower']]
dogs[, upper.conf := binconf(pass, total, alpha=0.2)[, 'Upper']]
dogs[, point.est  := binconf(pass, total, alpha=0.2)[, 'PointEst']]
dogs[, confidence := 1 - (upper.conf - lower.conf)]
dogs$dog.by.upper.conf <- factor(dogs$dog, levels=dogs[order(upper.conf), dog])
dogs$dog.by.lower.conf <- factor(dogs$dog, levels=dogs[order(lower.conf), dog])
dogs$dog.by.point.est  <- factor(dogs$dog, levels=dogs[order(point.est), dog])


box.width<-0.015
ggplot(dogs[total>0][order(-point.est)][200:220], aes(dog.by.lower.conf, lower.conf)) +
  geom_segment(aes(y=min(lower.conf), yend=lower.conf,
                   x=dog.by.lower.conf, xend=dog.by.lower.conf),
               lwd=0.1) +
  geom_boxplot(stat="identity", aes(ymin=lower.conf, ymax=upper.conf,
                                    middle=upper.conf,
                                    lower=lower.conf, upper=lower.conf+2*box.width,
                                    #width=log(2*(1-confidence))*.35,
                                    fill=lower.conf),
               varwidth=TRUE, lwd=0.5) +
  scale_fill_viridis(option="plasma") +
  #scale_color_viridis(option="plasma") +
  theme_classic() +
  coord_flip()

n<-100

dogs.norm <- as.data.table(merge.data.frame(dogs, data.table(x=seq(0, 1, length.out=n)), all=TRUE))
dogs.norm[, norm := dnorm(x, mean=point.est, sd=.08/confidence)]
#dogs.norm[, pois := dpois(x, lambda=4)]
dogs.norm[, bern := Rlab::dbern(x*(n-1), prob=point.est)]
dogs.norm[, binom := dbinom(round(x*(n-1)), n, prob=pass/total)]

dogs.norm[dog=="Pungsan", x*(n-1)]
dogs.norm[dog=="Pungsan"]$binom
dogs.norm[dog=="Irish Setter"]$binom

ggplot(dogs.norm[dog%in%rev(levels(dogs$dog.by.lower.conf))[10:20]], aes(x, dog.by.lower.conf, height=binom, fill=..x..)) +
  geom_density_ridges_gradient(stat="identity") +
  guides(fill=FALSE)

total.dog <- dogs$dog[do.call(c, mapply(function(dog, total) rep(dog, each=total+1), dogs$dog, dogs$total))]
total.x <- do.call(c, mapply(function(dog, total) seq(0, 1, length.out=total+1), dogs$dog, dogs$total))

dogs.scaled <- data.table(dog = total.dogs, x = total.x)
dogs.scaled <- merge(dogs.scaled, dogs, by="dog", all.x=TRUE)
dogs.scaled[, binom := dbinom(round(x*(total)), total, prob=pass/total)]

ggplot(dogs.scaled[dog%in%rev(levels(dogs$dog.by.lower.conf))[seq(1, 240, by=8)]],
       aes(x, dog.by.lower.conf, height=binom*sqrt(total*confidence), fill=..x..)) +
  geom_density_ridges_gradient(stat="identity") +
  guides(fill=FALSE)
